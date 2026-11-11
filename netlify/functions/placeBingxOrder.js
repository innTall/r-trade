// netlify/functions/placeBingxOrder.js
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

    const {symbol, side, price, quantity} = requestData;

    if (!symbol || !side || !price || !quantity) {
      return jsonResponse(400, {
        error:
          "Missing required order parameters (symbol, side, price, quantity)"
      });
    }

    const timestamp = Date.now();

    // Формируем объект параметров точно по спецификации BingX API
    const paramsObj = {
      symbol: String(symbol),
      side: String(side), // BUY или SELL
      positionSide: "BOTH", // Возвращаем positionSide, требуемый API
      type: "LIMIT",
      price: String(price),
      quantity: String(quantity),
      timeInForce: "GTC",
      timestamp: String(timestamp)
    };

    // 1. Сортировка ключей для подписи (БЕЗ URL-encode, как в официальном примере)
    const sortedKeys = Object.keys(paramsObj).sort();
    let signString = "";
    for (let i = 0; i < sortedKeys.length; i++) {
      if (i > 0) signString += "&";
      signString += sortedKeys[i] + "=" + paramsObj[sortedKeys[i]];
    }

    const signature = createHmac("sha256", secretKey)
      .update(signString)
      .digest("hex");

    // 2. Формирование параметров для URL (С URL-encode)
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
        headers: {
          "X-BX-APIKEY": apiKey
        }
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
      receivedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Unhandled error in placeBingxOrder function:", err);
    return jsonResponse(500, {
      success: false,
      error: "Internal server error in Netlify function",
      details: err.message
    });
  }
}
