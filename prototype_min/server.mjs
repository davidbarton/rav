#!/usr/bin/env node
/**
 * Serves the repository root on http://127.0.0.1:8000/ (same layout as a static file server from repo root).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.resolve(root, "." + path.sep + rel);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }

  let filePath = safeJoin(ROOT, req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    if (st.isDirectory()) {
      const index = path.join(filePath, "index.html");
      fs.stat(index, (e2, st2) => {
        if (!e2 && st2.isFile()) {
          serveFile(index, res, req.method === "HEAD");
        } else {
          res.writeHead(403);
          res.end("Directory listing disabled");
        }
      });
      return;
    }
    serveFile(filePath, res, req.method === "HEAD");
  });
});

function serveFile(filePath, res, headOnly) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error");
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": data.length });
    if (headOnly) res.end();
    else res.end(data);
  });
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}/`);
  console.log(`Open http://127.0.0.1:${PORT}/prototype_min/`);
});
