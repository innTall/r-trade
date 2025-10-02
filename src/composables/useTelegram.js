// src/composables/useTelegram.js
export async function sendTelegramMessage(text) {
  if (!text) {
    console.error("sendTelegramMessage: empty text");
    return { ok: false, error: "empty text" };
  }

  try {
    const url = `${window.location.origin}/.netlify/functions/sendTelegram`;
    console.log("sendTelegramMessage → calling:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        key: import.meta.env.VITE_ADMIN_KEY, // 🔑 optional admin key
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("Telegram function returned error:", json);
      return { ok: false, error: json };
    }

    return { ok: true, data: json };
  } catch (err) {
    console.error("sendTelegramMessage fetch error:", err);
    return { ok: false, error: err.message };
  }
}
