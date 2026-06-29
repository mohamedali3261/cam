export default async function handler(req, res) {
  const { method, raw, ...params } = req.query;

  const token = "8656851872:AAH4LhZaJNgZQOoatPNq9w4-QSD3KyhE2CY";

  // Serve file directly (for getFile)
  if (raw) {
    const fileUrl = `https://api.telegram.org/file/bot${token}/${raw}`;
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");

    return res.status(200).send(Buffer.from(buffer));
  }

  if (!method) {
    return res.status(400).json({ ok: false, description: "Missing method param" });
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;

  try {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, description: err.message });
  }
}
