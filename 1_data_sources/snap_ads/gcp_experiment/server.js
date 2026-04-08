const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 8080;
const SECRET = process.env.PROXY_SECRET || "";
const ALLOWED_HOST = "adsapi.snapchat.com";
const MAX_BODY = 16 * 1024;

let egressIp = "unknown";

function resolveEgressIp() {
  return new Promise((resolve) => {
    const req = https.get("https://api.ipify.org", (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(d.trim()));
    });
    req.on("error", () => resolve("lookup-failed"));
    req.setTimeout(5000, () => { req.destroy(); resolve("lookup-timeout"); });
  });
}

function die(res, status, msg) {
  res.writeHead(status, { "content-type": "application/json", "x-proxy-ip": egressIp });
  res.end(JSON.stringify({ error: msg }));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (SECRET && req.headers["x-proxy-secret"] !== SECRET) {
    return die(res, 403, "Forbidden");
  }

  let body = "";
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) { req.destroy(); return die(res, 413, "Body too large"); }
    body += chunk;
  });
  req.on("end", () => {
    const target = req.headers["x-target-url"];
    if (!target) return die(res, 400, "Missing x-target-url header");

    let url;
    try { url = new URL(target); } catch { return die(res, 400, "Invalid x-target-url"); }

    if (url.hostname !== ALLOWED_HOST) {
      return die(res, 403, `Only ${ALLOWED_HOST} is allowed`);
    }

    const proxy = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: req.method,
      headers: { "content-type": "application/json" },
      timeout: 25000,
    }, (upstream) => {
      let data = "";
      upstream.on("data", (chunk) => (data += chunk));
      upstream.on("end", () => {
        res.writeHead(upstream.statusCode, {
          "content-type": "application/json",
          "x-proxy-ip": egressIp,
          "x-proxy-region": process.env.K_REVISION || "unknown",
        });
        res.end(data, () => {
          setTimeout(() => process.exit(0), 50);
        });
      });
    });

    proxy.on("timeout", () => { proxy.destroy(); die(res, 504, "Upstream timeout"); });
    proxy.on("error", (err) => die(res, 502, err.message));

    if (body) proxy.write(body);
    proxy.end();
  });
});

resolveEgressIp().then((ip) => {
  egressIp = ip;
  server.listen(PORT, () => console.log(`Proxy listening on :${PORT} (egress IP: ${egressIp})`));
});
