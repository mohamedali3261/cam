const B64 = "ODY1Njg1MTg3MjpBQUg0TGhaYUpOZ1pRT29hdFBOcTl3NC1RU0QzS3loRTJDWQ==";
function getToken() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  return Buffer.from(B64, "base64").toString("utf-8");
}

// In-memory store (resets on cold start — use Vercel KV for persistence)
const devices = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, chatId, name, deviceId, mode } = req.query;

  if (action === "register" && chatId) {
    // Device registers via HTTP (independent of Telegram getUpdates)
    devices.set(chatId, {
      chatId,
      name: name || "جهاز",
      deviceId: deviceId || "",
      lastSeen: Date.now(),
      addedAt: Date.now(),
      mode: mode || "http",
    });
    // Also notify admin via Telegram
    const token = getToken();
    const adminChatId = "1141104495";
    const msg = `🆕 جهاز جديد مسجل (HTTP)
🆔 المعرف: ${deviceId || "—"}
📱 الجهاز: ${name || "جهاز"}
💬 Chat ID: ${chatId}`;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: adminChatId, text: msg }),
      });
    } catch (e) {}

    return res.status(200).json({ ok: true, message: "registered" });
  }

  if (action === "list") {
    const list = Array.from(devices.values());
    return res.status(200).json({ ok: true, devices: list });
  }

  if (action === "ping" && chatId) {
    const d = devices.get(chatId);
    if (d) {
      d.lastSeen = Date.now();
      return res.status(200).json({ ok: true, message: "pong" });
    }
    return res.status(404).json({ ok: false, message: "unknown device" });
  }

  return res.status(400).json({ ok: false, message: "missing params" });
}
