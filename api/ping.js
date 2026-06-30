const B64 = "ODY1Njg1MTg3MjpBQUg0TGhaYUpOZ1pRT29hdFBOcTl3NC1RU0QzS3loRTJDWQ==";
function getToken() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  return Buffer.from(B64, "base64").toString("utf-8");
}

const devices = new Map();

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, chatId, name, deviceId, mode } = req.query;

  if (action === "register" && chatId) {
    devices.set(chatId, {
      chatId,
      name: name || "جهاز",
      deviceId: deviceId || "",
      lastSeen: Date.now(),
      addedAt: Date.now(),
      mode: mode || "http",
    });
    // Notify admin via Telegram
    const token = getToken();
    const adminChatId = "1141104495";
    const msg = `🆕 جهاز جديد مسجل (HTTP)\n🆔 المعرف: ${deviceId || "—"}\n📱 الجهاز: ${name || "جهاز"}\n💬 Chat ID: ${chatId}`;
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
    return res.status(200).json({ ok: true, devices: Array.from(devices.values()) });
  }

  if (action === "ping" && chatId) {
    const d = devices.get(chatId);
    if (d) { d.lastSeen = Date.now(); return res.status(200).json({ ok: true }); }
    return res.status(404).json({ ok: false, message: "unknown" });
  }

  return res.status(400).json({ ok: false, message: "missing params" });
};
