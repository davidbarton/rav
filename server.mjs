import express from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { accessSync, constants } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const digest = (value) => createHash("sha256").update(value).digest();

export function createReportApp({ password, directory = root } = {}) {
  if (!password) throw new Error("REPORT_PASS environment variable is required.");
  const reports = [
    ["/dior", path.join(directory, "app/dist")],
    ["/norway", path.join(directory, "app-political/dist")],
  ];
  for (const [, dist] of reports) {
    try {
      accessSync(path.join(dist, "index.html"), constants.R_OK);
    } catch {
      throw new Error(`Missing report build at ${dist}. Run npm run build first.`);
    }
  }

  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  // Railway must be able to check readiness without report credentials.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const expected = digest(password);
  app.use((req, res, next) => {
    const auth = req.headers.authorization ?? "";
    if (/^Basic /i.test(auth)) {
      const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
      const colon = decoded.indexOf(":");
      if (colon !== -1 && timingSafeEqual(digest(decoded.slice(colon + 1)), expected)) {
        return next();
      }
    }
    res.setHeader("WWW-Authenticate", 'Basic realm="Ravineo Report", charset="UTF-8"');
    res.status(401).send("Authentication required");
  });

  app.get("/", (_req, res) => res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ravineo Reports</title>
<style>body{font-family:system-ui,sans-serif;max-width:44rem;margin:12vh auto;padding:1.5rem;color:#18332d;background:#f6f8f7}a{display:block;padding:1.5rem;margin:1rem 0;border:1px solid #cbd5d1;border-radius:.75rem;color:inherit;text-decoration:none;background:white}a:hover,a:focus-visible{border-color:#28614f}small{display:block;margin-top:.5rem;color:#52635d}</style>
</head><body><h1>Ravineo Reports</h1><p>Snapchat intelligence</p>
<a href="/dior/"><strong>Dior Fashion</strong><small>Competitive intelligence for Dior</small></a>
<a href="/norway/"><strong>Norway Political</strong><small>Political advertising transparency</small></a>
</body></html>`));

  for (const [route, dist] of reports) {
    app.use(route, express.static(dist, { cacheControl: false }));
    app.use(route, (req, res, next) => {
      // Missing assets must return 404, not an HTML document with status 200.
      if (!["GET", "HEAD"].includes(req.method) || req.path.startsWith("/assets/") || path.extname(req.path)) {
        return next();
      }
      res.sendFile(path.join(dist, "index.html"), { cacheControl: false });
    });
  }
  app.use((_req, res) => res.status(404).send("Not found"));
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const port = Number(process.env.PORT ?? "3001");
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid PORT.");
    const app = createReportApp({ password: process.env.REPORT_PASS });
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Reports listening on 0.0.0.0:${server.address().port}`);
    });
    for (const signal of ["SIGTERM", "SIGINT"]) {
      process.once(signal, () => {
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 5000).unref();
      });
    }
  } catch (error) {
    console.error(`[FATAL] ${error.message}`);
    process.exit(1);
  }
}
