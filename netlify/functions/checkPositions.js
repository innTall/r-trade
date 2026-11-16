// netlify/functions/checkPositions.js
import {createHmac} from "node:crypto";

const BINGX_BASE_URL = "https://open-api.bingx.com";

function log(event, details = {}) {
  console.log(
    JSON.stringify({
      function: "checkPositions",
      event,
      ...details
    })
  );
}

function getErrorDetails(error) {
  return {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : String(error)
  };
}

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

export const handler = async (event) => {
  const apiKey = process.env.BINGX_API_KEY;
  const secretKey = process.env.BINGX_API_SECRET;

  if (!apiKey || !secretKey) {
    log("api_credentials_missing");
    return {statusCode: 200};
  }

  try {
    log("fetching_positions");
    const posResult = await bingxRequest(
      "/openApi/swap/v2/user/positions",
      "GET",
      apiKey,
      secretKey
    );
    log("positions_response_received", {
      responseCode: posResult.code,
      positionCount: Array.isArray(posResult.data) ? posResult.data.length : 0
    });
    if (
      posResult.code !== 0 ||
      !posResult.data ||
      posResult.data.length === 0
    ) {
      log("no_active_positions_or_invalid_response", {
        responseCode: posResult.code
      });
      return {statusCode: 200};
    }

    const activePositions = posResult.data;

    for (const pos of activePositions) {
      const symbol = pos.symbol;
      let step = "reading_position";

      try {
        const positionAmt = Number(pos.positionAmt);
        const entryPrice = Number(pos.avgPrice);

        log("position_received", {symbol, positionAmt, entryPrice});
        if (positionAmt <= 0) {
          log("position_skipped_not_long", {symbol, positionAmt});
          continue; // Работаем с Long
        }

        // 2. Получаем открытые ордера для символа
        step = "fetching_open_orders";
        log("fetching_open_orders", {symbol});
        const ordersResult = await bingxRequest(
          "/openApi/swap/v2/trade/openOrders",
          "GET",
          apiKey,
          secretKey,
          {symbol}
        );
        log("open_orders_response_received", {
          symbol,
          responseCode: ordersResult.code,
          orderCount: Array.isArray(ordersResult.data?.orders)
            ? ordersResult.data.orders.length
            : Array.isArray(ordersResult.data)
              ? ordersResult.data.length
              : 0
        });
        if (ordersResult.code !== 0 || !ordersResult.data) {
          log("open_orders_unavailable", {
            symbol,
            responseCode: ordersResult.code
          });
          continue;
        }

        const openOrders = ordersResult.data.orders || ordersResult.data;

        // Ищем текущие защитные и целевые ордера
        const tp1Order = openOrders.find(
          (o) => o.reduceOnly === true && o.side === "SELL" && o.type === "LIMIT"
        );
        const stopLossOrder = openOrders.find(
          (o) => o.type === "STOP_MARKET" || o.type === "STOP"
        );
        log("open_orders_classified", {
          symbol,
          openOrderCount: openOrders.length,
          hasOpenTp1: Boolean(tp1Order),
          hasStopLoss: Boolean(stopLossOrder)
        });

        // Запрашиваем историю ордеров для получения clientOrderId (с зашитым beDiff) и статуса TP1
        step = "fetching_order_history";
        log("fetching_order_history", {symbol, limit: 15});
        const historyResult = await bingxRequest(
          "/openApi/swap/v2/trade/allOrders",
          "GET",
          apiKey,
          secretKey,
          {symbol, limit: 15}
        );
        log("order_history_response_received", {
          symbol,
          responseCode: historyResult.code,
          orderCount: Array.isArray(historyResult.data?.orders)
            ? historyResult.data.orders.length
            : Array.isArray(historyResult.data)
              ? historyResult.data.length
              : 0
        });
        if (historyResult.code !== 0 || !historyResult.data) {
          log("order_history_unavailable", {
            symbol,
            responseCode: historyResult.code
          });
          continue;
        }
        const ordersHistory = historyResult.data.orders || historyResult.data;

        // Извлекаем beDiff из тега clientOrderId исходного ордера входа
        step = "parsing_client_order_id";
        const entryOrder = ordersHistory.find(
          (o) => o.clientOrderId && o.clientOrderId.startsWith("TP1_")
        );
        const clientOrderId = entryOrder?.clientOrderId;
        log("parsing_client_order_id", {
          symbol,
          clientOrderId: clientOrderId || null
        });

        let beDiffPercent = 0.2; // Дефолт на крайний случай
        if (entryOrder && entryOrder.clientOrderId) {
          const parts = entryOrder.clientOrderId.split("_");
          if (parts[3] !== undefined) {
            beDiffPercent = Number(parts[3]);
          }
        }
        log("client_order_id_parsed", {
          symbol,
          clientOrderId: clientOrderId || null,
          beDiffPercent
        });

        // СЦЕНАРИЙ А: Позиция открыта, но лимитный ордер TP1 еще вообще не выставлен на биржу
        if (!tp1Order && entryOrder) {
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

              step = "placing_missing_tp1";
              log("placing_missing_tp1", {symbol, price: tp1Params.price});
              const tp1Result = await bingxRequest(
                "/openApi/swap/v2/trade/order",
                "POST",
                apiKey,
                secretKey,
                tp1Params
              );
              log("missing_tp1_placement_response", {
                symbol,
                responseCode: tp1Result.code
              });
              continue; // Переходим к следующей итерации
            }
          }
        }

        // СЦЕНАРИЙ Б: Проверяем, действительно ли TP1 исполнен (FILLED)
        step = "detecting_filled_tp1";
        const filledTp1Order = ordersHistory.find(
          (o) =>
            o.reduceOnly === true &&
            o.side === "SELL" &&
            o.type === "LIMIT" &&
            (o.status === "FILLED" || o.status === "Filled")
        );
        log("filled_tp1_detection_completed", {
          symbol,
          isFilled: Boolean(filledTp1Order),
          filledOrderId: filledTp1Order?.orderId || null,
          status: filledTp1Order?.status || null
        });

        if (filledTp1Order) {
          // Корректно рассчитываем цену безубытка с учетом beDiff из настроек модалки
          const breakEvenPrice = Number(
            (entryPrice * (1 + beDiffPercent / 100)).toFixed(6)
          );
          log("break_even_price_calculated", {
            symbol,
            entryPrice,
            beDiffPercent,
            breakEvenPrice
          });

          let needToUpdateSl = true;
          if (stopLossOrder) {
            const currentSlPrice = Number(
              stopLossOrder.stopPrice || stopLossOrder.price
            );
            if (currentSlPrice >= breakEvenPrice) {
              needToUpdateSl = false; // Стоп уже перенесен на уровень BE или выше
              log("break_even_stop_already_in_place", {
                symbol,
                currentSlPrice,
                breakEvenPrice
              });
            } else {
              // Отменяем старый далекий стоп-лосс
              step = "cancelling_old_stop_loss";
              log("cancelling_old_stop_loss", {
                symbol,
                orderId: stopLossOrder.orderId,
                currentSlPrice,
                breakEvenPrice
              });
              const cancelResult = await bingxRequest(
                "/openApi/swap/v2/trade/order",
                "DELETE",
                apiKey,
                secretKey,
                {
                  symbol,
                  orderId: stopLossOrder.orderId
                }
              );
              log("old_stop_loss_cancellation_response", {
                symbol,
                orderId: stopLossOrder.orderId,
                responseCode: cancelResult.code
              });
            }
          } else {
            log("no_existing_stop_loss", {symbol});
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

            step = "placing_break_even_stop_loss";
            log("placing_break_even_stop_loss", {
              symbol,
              stopPrice: newSlParams.stopPrice,
              quantity: newSlParams.quantity,
              workingType: newSlParams.workingType
            });
            const stopLossResult = await bingxRequest(
              "/openApi/swap/v2/trade/order",
              "POST",
              apiKey,
              secretKey,
              newSlParams
            );
            log("break_even_stop_loss_placement_response", {
              symbol,
              responseCode: stopLossResult.code
            });
          }
        }
      } catch (error) {
        log("position_processing_failed", {
          symbol,
          step,
          ...getErrorDetails(error)
        });
      }
    }

    log("positions_processing_completed", {
      positionCount: activePositions.length
    });
    return {statusCode: 200};
  } catch (error) {
    log("handler_failed", getErrorDetails(error));
    return {statusCode: 200};
  }
};
