// src/composables/useTelegram.js
export async function sendTelegramMessage(text) {
  if (!text) {
    console.error("sendTelegramMessage: empty text");
    return {ok: false, error: "empty text"};
  }

  try {
    const res = await fetch("/.netlify/functions/sendTelegram", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text})
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("Telegram function returned error:", json);
      return {ok: false, error: json};
    }
    return {ok: true, data: json};
  } catch (err) {
    console.error("sendTelegramMessage fetch error:", err);
    return {ok: false, error: err.message};
  }
}
