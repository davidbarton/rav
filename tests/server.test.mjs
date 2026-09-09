import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createReportApp } from "../server.mjs";

const password = "test:report-password";
const headers = { Authorization: `Basic ${Buffer.from(`viewer:${password}`).toString("base64")}` };
let server;
let base;
before(async () => {
  server = createReportApp({ password }).listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server ? server.close(resolve) : resolve()));

test("readiness is accessible without credentials", async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("report routes require valid Basic Auth", async () => {
  for (const route of ["/", "/dior/", "/norway/", "/dior/assets/missing.js"]) {
    for (const authorization of ["", "Basic invalid", `Basic ${Buffer.from("viewer:wrong").toString("base64")}`]) {
      const response = await fetch(`${base}${route}`, { headers: { Authorization: authorization } });
      assert.equal(response.status, 401);
      assert.match(response.headers.get("www-authenticate"), /^Basic /);
    }
  }
});

test("landing page links to both reports", async () => {
  const response = await fetch(base, { headers });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="\/dior\/"/);
  assert.match(html, /href="\/norway\/"/);
});

for (const route of ["/dior", "/norway"]) {
  test(`${route} serves its actual build, assets, and nested navigation`, async () => {
    const redirect = await fetch(`${base}${route}`, { headers, redirect: "manual" });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get("location"), `${route}/`);
    const response = await fetch(`${base}${route}/`, { headers });
    assert.equal(response.status, 200);
    const html = await response.text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
    assert.ok(assets.length >= 2, "built JS and CSS must exist");
    for (const asset of assets) {
      assert.ok(asset.startsWith(`${route}/assets/`));
      const result = await fetch(`${base}${asset}`, { headers });
      assert.equal(result.status, 200);
      assert.match(result.headers.get("content-type"), asset.endsWith(".js") ? /javascript/ : /css/);
      assert.match(result.headers.get("cache-control"), /private/);
    }
    const nested = await fetch(`${base}${route}/report/details`, { headers });
    assert.equal(nested.status, 200);
    assert.equal(await nested.text(), html);
    const head = await fetch(`${base}${route}/`, { headers, method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  });
}

test("unknown paths, missing assets, and research files are not served", async () => {
  for (const route of ["/missing", "/api/explore", "/dior/assets/missing.js", "/norway/assets/missing.css", "/dior-other", "/.env", "/db/rav.db", "/data_sources/example.json"]) {
    assert.equal((await fetch(`${base}${route}`, { headers })).status, 404, route);
  }
});

test("startup fails without a password or either built report", async () => {
  assert.throws(() => createReportApp(), /REPORT_PASS/);
  const directory = await mkdtemp(path.join(os.tmpdir(), "rav-test-"));
  try {
    assert.throws(() => createReportApp({ password, directory }), /Missing report build/);
    await mkdir(path.join(directory, "app/dist"), { recursive: true });
    await writeFile(path.join(directory, "app/dist/index.html"), "dior");
    assert.throws(() => createReportApp({ password, directory }), /app-political/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("production entrypoint honors PORT and shuts down on SIGTERM", { timeout: 10000 }, async (t) => {
  const entrypoint = fileURLToPath(new URL("../server.mjs", import.meta.url));
  const child = spawn(process.execPath, [entrypoint], {
    env: { ...process.env, PORT: "0", REPORT_PASS: password },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => { if (child.exitCode === null) child.kill("SIGKILL"); });
  const [output] = await once(child.stdout, "data");
  const match = output.toString().match(/0\.0\.0\.0:(\d+)/);
  assert.ok(match, output.toString());
  assert.equal((await fetch(`http://127.0.0.1:${match[1]}/health`)).status, 200);
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  assert.deepEqual(await exited, [0, null]);
  const missingPassword = spawnSync(process.execPath, [entrypoint], {
    env: { ...process.env, REPORT_PASS: "" }, encoding: "utf8", timeout: 5000,
  });
  assert.equal(missingPassword.status, 1);
  assert.match(missingPassword.stderr, /REPORT_PASS/);
});
