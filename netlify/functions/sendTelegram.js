// netlify/functions/sendTelegram.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({error: "Method not allowed"})
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const text = body.text || "";
    if (!text)
      return {statusCode: 400, body: JSON.stringify({error: "Missing text"})};

    const BOT = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;

    // 🔥 Debug log — check what env vars are actually being used
    console.log(
      "DEBUG TELEGRAM_BOT_TOKEN (first 10 chars):",
      BOT ? BOT.slice(0, 10) + "..." : "MISSING"
    );
    console.log("DEBUG TELEGRAM_CHAT_ID:", CHAT || "MISSING");

    if (!BOT || !CHAT) {
      return {
        statusCode: 500,
        body: JSON.stringify({error: "Telegram env vars missing on server"})
      };
    }

    const url = `https://api.telegram.org/bot${BOT}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: CHAT,
        text,
        parse_mode: "HTML"
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return {statusCode: 500, body: JSON.stringify({ok: false, error: data})};
    }

    return {statusCode: 200, body: JSON.stringify({ok: true, result: data})};
  } catch (err) {
    console.error("sendTelegram handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ok: false, error: err.message})
    };
  }
}
