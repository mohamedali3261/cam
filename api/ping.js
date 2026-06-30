export default {
  fetch() {
    return new Response(JSON.stringify({ ok: true, message: "pong" }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  },
};
