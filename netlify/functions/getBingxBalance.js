// netlify/functions/getBingxBalance.vue
import { createHmac } from "node:crypto";

const BINGX_BALANCE_URL =
  "https://open-api.bingx.com/openApi/swap/v3/user/balance";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, {error: "Method not allowed"});
  }

  const apiKey = process.env.BINGX_API_KEY;
  const secretKey = process.env.BINGX_API_SECRET;

  if (!apiKey || !secretKey) {
    return jsonResponse(500, {error: "BingX API credentials are not configured"});
  }

  const params = {timestamp: String(Date.now())};
  const query = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
  const signature = createHmac("sha256", secretKey)
    .update(query)
    .digest("hex");
  const url = `${BINGX_BALANCE_URL}?${query}&signature=${signature}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {"X-BX-APIKEY": apiKey}
    });
  } catch {
    return jsonResponse(502, {error: "Unable to reach the BingX API"});
  }

  if (!response.ok) {
    return jsonResponse(502, {error: "BingX API returned an unsuccessful HTTP status"});
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return jsonResponse(502, {error: "BingX API returned an invalid response"});
  }

  if (!result || (result.code !== 0 && result.code !== "0")) {
    return jsonResponse(502, {error: "BingX API reported an error"});
  }

  if (!Array.isArray(result.data)) {
    return jsonResponse(502, {error: "BingX API returned an invalid balance list"});
  }

  const usdtBalance = result.data.find((item) => item?.asset === "USDT");
  if (!usdtBalance) {
    return jsonResponse(502, {error: "USDT balance was not found in the BingX response"});
  }

  const rawBalance = usdtBalance.balance;
  const balance = Number(rawBalance);
  if (
    (typeof rawBalance !== "number" && typeof rawBalance !== "string") ||
    (typeof rawBalance === "string" && rawBalance.trim() === "") ||
    !Number.isFinite(balance) ||
    balance < 0
  ) {
    return jsonResponse(502, {error: "BingX returned an invalid USDT balance"});
  }

  return jsonResponse(200, {
    balance,
    asset: "USDT",
    receivedAt: new Date().toISOString()
  });
}
