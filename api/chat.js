const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  let body = "";
  await new Promise((resolve) => {
    req.on("data", chunk => body += chunk);
    req.on("end", resolve);
  });

  const { messages } = JSON.parse(body);
  const API_KEY = process.env.ANTHROPIC_API_KEY || "";

  const payload = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: "Sos el asistente de Medeot Connessi. Respondé en español.",
    messages: messages
  });

  return new Promise((resolve) => {
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
        res.status(proxyRes.statusCode).send(data);
        resolve();
      });
    });

    proxyReq.on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    proxyReq.write(payload);
    proxyReq.end();
  });
};
