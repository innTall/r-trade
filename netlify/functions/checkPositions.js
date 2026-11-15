// netlify/functions/checkPositions.js
import {schedule} from "@netlify/functions";
import {createHmac} from "node:crypto";

const BINGX_BASE_URL = "https://open-api.bingx.com";

function signRequest(secretKey, params) {
  const sortedKeys = Object.keys(params).sort();
  let signString = "";
  for (let i = 0; i < sortedKeys.length; i++) {
    if (i > 0) signString += "&";
    signString += `${sortedKeys[i]}=${params[sortedKeys[i]]}`;
  }
  return createHmac("sha256", secretKey).update(signString).digest("hex");
}

async function bingxRequest(endpoint, method, apiKey, secretKey, data = {}) {
  const timestamp = Date.now();
  let queryParams = {...data, timestamp: String(timestamp)};

  const signature = signRequest(secretKey, queryParams);

  const queryString = Object.keys(queryParams)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  let url = `${BINGX_BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

  const response = await fetch(url, {
    method,
    headers: {
      "X-BX-APIKEY": apiKey,
      "Content-Type": "application/json"
    }
  });
  return await response.json();
}

export const handler = schedule("* * * * *", async (event) => {
  const apiKey = process.env.BINGX_API_KEY;
  const secretKey = process.env.BINGX_API_SECRET;

  if (!apiKey || !secretKey) {
    return {statusCode: 200};
  }

  try {
    // 1. Получаем активные позиции
    const posResult = await bingxRequest(
      "/openApi/swap/v2/user/positions",
      "GET",
      apiKey,
      secretKey
    );
    if (
      posResult.code !== 0 ||
      !posResult.data ||
      posResult.data.length === 0
    ) {
      return {statusCode: 200};
    }

    const activePositions = posResult.data;

    for (const pos of activePositions) {
      const symbol = pos.symbol;
      const positionAmt = Number(pos.positionAmt);
      const entryPrice = Number(pos.avgPrice);

      if (positionAmt <= 0) continue; // Работаем с Long

      // 2. Получаем открытые ордера для символа
      const ordersResult = await bingxRequest(
        "/openApi/swap/v2/trade/openOrders",
        "GET",
        apiKey,
        secretKey,
        {symbol}
      );
      if (ordersResult.code !== 0 || !ordersResult.data) continue;

      const openOrders = ordersResult.data.orders || ordersResult.data;

      // Ищем текущие защитные и целевые ордера
      const tp1Order = openOrders.find(
        (o) => o.reduceOnly === true && o.side === "SELL" && o.type === "LIMIT"
      );
      const stopLossOrder = openOrders.find(
        (o) => o.type === "STOP_MARKET" || o.type === "STOP"
      );

      // Запрашиваем историю ордеров для получения clientOrderId (с зашитым beDiff) и статуса TP1
      const historyResult = await bingxRequest(
        "/openApi/swap/v2/trade/allOrders",
        "GET",
        apiKey,
        secretKey,
        {symbol, limit: 15}
      );

      if (historyResult.code !== 0 || !historyResult.data) continue;
      const ordersHistory = historyResult.data.orders || historyResult.data;

      // Извлекаем beDiff из тега clientOrderId исходного ордера входа
      const entryOrder = ordersHistory.find(
        (o) => o.clientOrderId && o.clientOrderId.startsWith("TP1_")
      );

      let beDiffPercent = 0.2; // Дефолт на крайний случай
      if (entryOrder && entryOrder.clientOrderId) {
        const parts = entryOrder.clientOrderId.split("_");
        if (parts[3] !== undefined) {
          beDiffPercent = Number(parts[3]);
        }
      }

      // СЦЕНАРИЙ А: Позиция открыта, но лимитный ордер TP1 еще вообще не выставлен на биржу
      if (!tp1Order) {
        if (entryOrder) {
          const existingTp1InHistory = ordersHistory.find(
            (o) =>
              o.reduceOnly === true && o.side === "SELL" && o.type === "LIMIT"
          );

          if (!existingTp1InHistory) {
            const parts = entryOrder.clientOrderId.split("_");
            const tp1Price = parts[1];
            const tp1Qty = parts[2];

            if (tp1Price && tp1Qty) {
              // Автоматически выставляем лимитный TP1 ордер
              const tp1Params = {
                symbol,
                side: "SELL",
                positionSide: "BOTH",
                type: "LIMIT",
                price: String(tp1Price),
                quantity: String(tp1Qty),
                timeInForce: "GTC",
                reduceOnly: "true"
              };

              await bingxRequest(
                "/openApi/swap/v2/trade/order",
                "POST",
                apiKey,
                secretKey,
                tp1Params
              );
              continue; // Переходим к следующей итерации
            }
          }
        }
      }

      // СЦЕНАРИЙ Б: Проверяем, действительно ли TP1 исполнен (FILLED)
      const filledTp1Order = ordersHistory.find(
        (o) =>
          o.reduceOnly === true &&
          o.side === "SELL" &&
          o.type === "LIMIT" &&
          (o.status === "FILLED" || o.status === "Filled")
      );

      if (filledTp1Order) {
        // Корректно рассчитываем цену безубытка с учетом beDiff из настроек модалки
        const breakEvenPrice = Number(
          (entryPrice * (1 + beDiffPercent / 100)).toFixed(6)
        );

        let needToUpdateSl = true;
        if (stopLossOrder) {
          const currentSlPrice = Number(
            stopLossOrder.stopPrice || stopLossOrder.price
          );
          if (currentSlPrice >= breakEvenPrice) {
            needToUpdateSl = false; // Стоп уже перенесен на уровень BE или выше
          } else {
            // Отменяем старый далекий стоп-лосс
            await bingxRequest(
              "/openApi/swap/v2/trade/order",
              "DELETE",
              apiKey,
              secretKey,
              {
                symbol,
                orderId: stopLossOrder.orderId
              }
            );
          }
        }

        if (needToUpdateSl) {
          // Выставляем новый Stop Loss по MARK_PRICE на уровень Безубыток + BE_DIFF
          const newSlParams = {
            symbol,
            side: "SELL",
            positionSide: "BOTH",
            type: "STOP_MARKET",
            stopPrice: String(breakEvenPrice), // Переменная теперь задействована!
            price: "0",
            quantity: String(positionAmt),
            workingType: "MARK_PRICE"
          };

          await bingxRequest(
            "/openApi/swap/v2/trade/order",
            "POST",
            apiKey,
            secretKey,
            newSlParams
          );
        }
      }
    }

    return {statusCode: 200};
  } catch (error) {
    return {statusCode: 200};
  }
});
