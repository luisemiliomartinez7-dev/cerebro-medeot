const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const { messages } = req.body;
  const SYSTEM = process.env.ANTHROPIC_SYSTEM || "";
  const API_KEY = process.env.ANTHROPIC_API_KEY || "";

  const payload = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM,
    messages: messages
  });

  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", chunk => data += chunk);
    proxyRes.on("end", () => {
      res.status(proxyRes.statusCode).json(JSON.parse(data));
    });
  });

  proxyReq.on("error", (e) => res.status(500).json({ error: e.message }));
  proxyReq.write(payload);
  proxyReq.end();
};
