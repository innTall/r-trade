// netlify/functions/placeBingxBuy.js
import {createHmac} from "node:crypto";

const BINGX_ORDER_URL =
  "https://open-api.bingx.com/openApi/swap/v2/trade/order";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  };
}

function parsePositiveNumber(value) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" &&
      !/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return jsonResponse(405, {error: "Method not allowed"});
    }

    const apiKey = process.env.BINGX_API_KEY;
    const secretKey = process.env.BINGX_API_SECRET;

    if (!apiKey || !secretKey) {
      return jsonResponse(500, {
        error: "BingX API credentials are not configured in environment"
      });
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body || "{}");
    } catch (parseErr) {
      return jsonResponse(400, {
        error: "Invalid JSON in request body",
        details: parseErr.message
      });
    }

    if (
      !requestData ||
      typeof requestData !== "object" ||
      Array.isArray(requestData)
    ) {
      return jsonResponse(400, {error: "Request body must be a JSON object"});
    }

    // Принимаем базовые параметры и разделенные объемы TP1 / Remainder
    const {
      symbol,
      side,
      price,
      quantity,
      tp1Qty,
      remQty,
      tp1Price,
      tp2Price,
      stopLoss,
      takeProfit
    } = requestData;

    if (
      typeof symbol !== "string" ||
      !symbol.trim() ||
      typeof side !== "string" ||
      !["BUY", "SELL"].includes(side) ||
      parsePositiveNumber(price) === null ||
      parsePositiveNumber(quantity) === null
    ) {
      return jsonResponse(400, {
        error:
          "Order requires a valid symbol, side, positive price, and positive quantity"
      });
    }

    // Валидация разделенных объемов (если переданы)
    if (tp1Qty !== undefined && parsePositiveNumber(tp1Qty) === null) {
      return jsonResponse(400, {error: "Invalid tp1Qty value"});
    }
    if (remQty !== undefined && parsePositiveNumber(remQty) === null) {
      return jsonResponse(400, {error: "Invalid remQty value"});
    }

    let validatedStopLoss = null;
    if (stopLoss !== undefined && stopLoss !== null) {
      const stopPrice = parsePositiveNumber(stopLoss.stopPrice);
      if (stopPrice === null) {
        return jsonResponse(400, {
          error: "Stop Loss stopPrice must be a valid positive number"
        });
      }
      validatedStopLoss = {stopPrice};
    }

    let validatedTakeProfit = null;
    if (takeProfit !== undefined && takeProfit !== null) {
      const stopPrice = parsePositiveNumber(takeProfit.stopPrice);
      if (stopPrice === null) {
        return jsonResponse(400, {
          error: "Take Profit stopPrice must be a valid positive number"
        });
      }
      validatedTakeProfit = {stopPrice};
    }

    const timestamp = Date.now();

    const paramsObj = {
      symbol: String(symbol),
      side: String(side),
      positionSide: "BOTH",
      type: "LIMIT",
      price: String(price),
      quantity: String(quantity), // Общий объем (totalQty)
      timeInForce: "GTC",
      timestamp: String(timestamp)
    };

    if (validatedStopLoss) {
      paramsObj.stopLoss = JSON.stringify({
        type: "STOP_MARKET",
        stopPrice: Number(validatedStopLoss.stopPrice),
        price: 0
      });
    }

    if (validatedTakeProfit) {
      paramsObj.takeProfit = JSON.stringify({
        type: "TAKE_PROFIT_MARKET",
        stopPrice: Number(validatedTakeProfit.stopPrice),
        price: 0
      });
    }

    const sortedKeys = Object.keys(paramsObj).sort();
    let signString = "";
    for (let i = 0; i < sortedKeys.length; i++) {
      if (i > 0) signString += "&";
      signString += sortedKeys[i] + "=" + paramsObj[sortedKeys[i]];
    }

    const signature = createHmac("sha256", secretKey)
      .update(signString)
      .digest("hex");

    let encodedParams = "";
    for (let i = 0; i < sortedKeys.length; i++) {
      if (i > 0) encodedParams += "&";
      const key = sortedKeys[i];
      encodedParams += key + "=" + encodeURIComponent(paramsObj[key]);
    }

    const url = `${BINGX_ORDER_URL}?${encodedParams}&signature=${signature}`;

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {"X-BX-APIKEY": apiKey}
      });
    } catch (fetchErr) {
      return jsonResponse(502, {
        error: "Unable to reach the BingX API",
        details: fetchErr.message
      });
    }

    let result;
    try {
      const rawText = await response.text();
      result = JSON.parse(rawText);
    } catch (jsonErr) {
      return jsonResponse(502, {error: "BingX API returned non-JSON response"});
    }

    if (!result || (result.code !== 0 && result.code !== "0")) {
      return jsonResponse(200, {
        success: false,
        error:
          result?.msg || result?.message || "BingX API reported an order error",
        bingxCode: result?.code || "UNKNOWN"
      });
    }

    return jsonResponse(200, {
      success: true,
      data: result.data,
      splitDetails: {
        tp1Qty: tp1Qty || null,
        remQty: remQty || null,
        tp1Price: tp1Price || null,
        tp2Price: tp2Price || null
      },
      receivedAt: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse(500, {
      success: false,
      error: "Internal server error in Netlify function",
      details: err.message
    });
  }
}
