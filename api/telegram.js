const B64 = "ODY1Njg1MTg3MjpBQUg0TGhaYUpOZ1pRT29hdFBOcTl3NC1RU0QzS3loRTJDWQ==";
function getToken() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  return Buffer.from(B64, "base64").toString("utf-8");
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = url.searchParams.get("method");
    const raw = url.searchParams.get("raw");
    const params = {};
    for (const [k, v] of url.searchParams) {
      if (k !== "method" && k !== "raw") params[k] = v;
    }
    const token = getToken();

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (raw) {
      const fileUrl = `https://api.telegram.org/file/bot${token}/${raw}`;
      const resp = await fetch(fileUrl);
      const buffer = await resp.arrayBuffer();
      return new Response(buffer, {
        status: 200,
        headers: {
          ...headers,
          "Cache-Control": "public, max-age=86400",
          "Content-Type": resp.headers.get("content-type") || "image/jpeg",
        },
      });
    }

    if (!method) {
      return new Response(JSON.stringify({ ok: false, description: "Missing method param" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const apiUrl = `https://api.telegram.org/bot${token}/${method}`;

    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, description: err.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
  },
};
