#!/usr/bin/env node
/**
 * Zero-dependency multi-viewport responsive + a11y audit over CDP (Edge headless).
 * Reuses one browser target across all probes for speed.
 * Usage: node scripts/qa/audit.mjs --port 3100 [--demo-port 3101] [--out qa]
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const EDGE = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const PORT = Number(arg("port", 3100));
const DEMO_PORT = arg("demo-port") ? Number(arg("demo-port")) : null;
const OUT = arg("out", "qa");
const CDP_PORT = 9333;
const BASE = `http://127.0.0.1:${PORT}`;

/* ── matrix ──────────────────────────────────────────────────────────── */
const ROUTES = ["/", "/categories", "/brands", "/search?q=cement", "/enquiry", "/contact",
  "/about", "/delivery", "/calculator", "/quote", "/terms", "/privacy", "/compare",
  "/enquiry-tracker", "/admin/login", "/sign-in", "/this-page-does-not-exist",
  "/category/construction", "/category/construction/cement",
  "/category/construction/cement/opc-cement", "/category/construction/bricks-blocks/red-clay-bricks"];
const KEY_ROUTES = ["/", "/categories", "/search?q=cement", "/enquiry", "/contact", "/admin/login"];
const CORE_VPS = [[320, 680, true], [390, 844, true], [768, 1024, true], [1366, 900, false], [1920, 1080, false]];
const EXTRA_VPS = [[480, 800, true], [600, 900, true], [1024, 768, false], [2560, 1440, false], [3440, 1440, false], [3840, 2160, false]];
const SHOT_WIDTHS = [320, 390, 768, 1024, 1366, 1920];

/* ── CDP client ──────────────────────────────────────────────────────── */
class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Set();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        for (const h of this.handlers) h(msg);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }
      }, 45000);
    });
  }
  on(handler) { this.handlers.add(handler); }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function startEdge() {
  const dir = `/private/var/folders/p2/181qb315029281dkw6w159gh0000gn/T/opencode/edge-qa-${Date.now()}`;
  const proc = spawn(EDGE, [
    "--headless", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${dir}`,
    "--no-first-run", "--disable-gpu", "--window-size=1366,900", "about:blank",
  ], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const v = await res.json();
      return { proc, wsUrl: v.webSocketDebuggerUrl };
    } catch { await wait(500); }
  }
  throw new Error("Edge headless did not expose CDP");
}

const PROBE = `(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const doc = document.documentElement;
  const vw = doc.clientWidth;
  const overflowX = doc.scrollWidth - vw;
  const offenders = [];
  if (overflowX > 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) {
        offenders.push({ tag: el.tagName, cls: String(el.className).slice(0, 90), right: Math.round(r.right), left: Math.round(r.left) });
        if (offenders.length >= 10) break;
      }
    }
  }
  const imgs = [...document.images];
  const brokenImgs = imgs.filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.currentSrc.slice(0, 120));
  const noAlt = imgs.filter(i => !i.hasAttribute('alt')).length;
  const unlabeled = [];
  for (const el of document.querySelectorAll('input, select, textarea')) {
    const id = el.id;
    const lbl = id ? document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]') : null;
    const ok = !!(lbl || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label') || el.type === 'hidden');
    if (!ok) unlabeled.push({ tag: el.tagName, type: el.type || null, id: id || null, name: el.name || null });
  }
  const tiny = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (el.children.length === 0 && el.textContent.trim()) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs && fs < 11) {
        tiny.push({ fs, cls: String(el.className).slice(0, 60), text: el.textContent.trim().slice(0, 26) });
        if (tiny.length >= 8) break;
      }
    }
  }
  const smallTargets = [];
  for (const el of document.querySelectorAll('button, a, [role="button"], summary, input')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    const minDim = Math.min(r.width, r.height);
    if (minDim < 24) {
      smallTargets.push({ min: Math.round(minDim * 10) / 10, tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) });
      if (smallTargets.length >= 10) break;
    }
  }
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]));
  let skip = 0;
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i-1] > 1) skip++;
  let lcp = 0, cls = 0;
  try {
    new PerformanceObserver(l => { const e = l.getEntries(); if (e.length) lcp = e[e.length-1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  await sleep(350);
  return {
    vw, scrollW: doc.scrollWidth, overflowX, offenders,
    imgs: imgs.length, brokenImgs, noAlt, unlabeled, tinyText: tiny, smallTargets,
    headings, headingSkips: skip,
    h1Count: headings.filter(h => h === 1).length,
    lcp: Math.round(lcp), cls: Math.round(cls * 1000) / 1000,
    title: document.title.slice(0, 70), lang: doc.lang || null,
  };
})()`;

/* ── runner state (one target reused for every probe) ────────────────── */
const results = [];
let consoleBuf = [];
let failedBuf = [];
let session = null;
let currentEventSink = null;
const pendingUrls = new Map();

async function main(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  session = sessionId;
  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Page.loadEventFired" && currentEventSink) currentEventSink("load");
    if (msg.method === "Network.requestWillBeSent" && msg.params?.request?.url) {
      pendingUrls.set(msg.params.requestId, msg.params.request.url);
    } else if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      consoleBuf.push(`EXCEPTION: ${d.exception?.description || d.text}`.slice(0, 280));
    } else if (msg.method === "Log.entryAdded" && ["error", "warning"].includes(msg.params.entry.level)) {
      const text = String(msg.params.entry.text);
      if (text.includes("/_next/hmr")) return; // dev-server artifact on the demo clone
      consoleBuf.push(`${msg.params.entry.level.toUpperCase()}: ${text.slice(0, 220)}`);
    } else if (msg.method === "Network.loadingFailed") {
      const url = pendingUrls.get(msg.params.requestId) || "";
      pendingUrls.delete(msg.params.requestId);
      if (url.includes("/_next/hmr")) return;
      failedBuf.push(`${String(msg.params.errorText).slice(0, 80)} ${url.replace(/\?.*$/, "").slice(0, 110)}`);
    }
  });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Log.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);

  async function runProbe({ url, label, width, height, mobile, screenshot, media, rootFs, settle = 1100 }) {
    consoleBuf = []; failedBuf = []; pendingUrls.clear();
    await cdp.send("Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile: !!mobile }, sessionId);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: !!mobile, maxTouchPoints: 5 }, sessionId);
    if (mobile) {
      await cdp.send("Emulation.setUserAgentOverride", {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      }, sessionId);
    }
    if (media) await cdp.send("Emulation.setEmulatedMedia", { features: media }, sessionId);

    currentEventSink = null;
    const loaded = new Promise((resolve) => { currentEventSink = resolve; setTimeout(resolve, 20000); });
    await cdp.send("Page.navigate", { url }, sessionId);
    await loaded;
    await wait(settle);

    const probe = await cdp.send("Runtime.evaluate",
      { expression: PROBE, awaitPromise: true, returnByValue: true }, sessionId);
    let data = probe.result?.value || {};

    if (rootFs) {
      await cdp.send("Runtime.evaluate",
        { expression: `document.documentElement.style.setProperty('font-size','${rootFs}')` }, sessionId);
      await wait(600);
      const z = await cdp.send("Runtime.evaluate", {
        expression: `JSON.stringify({overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth})`,
        returnByValue: true,
      }, sessionId);
      data = { ...data, zoom24: JSON.parse(z.result.value) };
    }

    const entry = { route: label, width, height, mobile: !!mobile, ...data,
      console: [...new Set(consoleBuf)].slice(0, 10),
      failedRequests: [...new Set(failedBuf)].slice(0, 6) };
    results.push(entry);

    if (screenshot) {
      try {
        const shot = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 72 }, sessionId);
        const file = path.join(OUT, "evidence",
          `${label.replace(/[^a-z0-9-]+/gi, "_")}-${width}x${height}${media ? "-" + media.map(m => m.value).join("_") : ""}${rootFs ? "-fs24" : ""}.jpg`);
        await writeFile(file, Buffer.from(shot.data, "base64"));
      } catch { /* screenshots are best-effort */ }
    }
  }

  /* warm every route once (populates Next fetch cache) */
  console.log(`Warming ${ROUTES.length} routes…`);
  for (const route of ROUTES) {
    await runProbe({ url: BASE + route, label: route, width: 1366, height: 900, settle: 400 });
    results.pop();
  }

  let n = 0; const total =
    ROUTES.length * CORE_VPS.length + KEY_ROUTES.length * EXTRA_VPS.length +
    4 + (DEMO_PORT ? 12 : 0) + 4 + 3;
  const tick = () => { n++; process.stdout.write(`\\r[${n}/${total}]                    `); };

  for (const [w, h, m] of CORE_VPS) {
    for (const route of ROUTES) {
      tick();
      await runProbe({ url: BASE + route, label: route, width: w, height: h, mobile: m,
        screenshot: SHOT_WIDTHS.includes(w) && KEY_ROUTES.includes(route) });
    }
  }
  for (const [w, h, m] of EXTRA_VPS) {
    for (const route of KEY_ROUTES) {
      tick();
      await runProbe({ url: BASE + route, label: route, width: w, height: h, mobile: m });
    }
  }
  // landscape orientation
  for (const route of ["/", "/categories"]) {
    tick(); await runProbe({ url: BASE + route, label: route, width: 844, height: 390, mobile: true });
    tick(); await runProbe({ url: BASE + route, label: route, width: 1180, height: 820, mobile: true });
  }

  if (DEMO_PORT) {
    const demoRoutes = ["/product/ultratech-opc-53-cement", "/product/tmt-fe-500d-steel-bar", "/search?q=brick"];
    for (const route of demoRoutes) {
      for (const [w, h, m] of [[320, 680, true], [390, 844, true], [1024, 768, false], [1366, 900, false]]) {
        tick();
        await runProbe({ url: `http://127.0.0.1:${DEMO_PORT}${route}`, label: "demo:" + route,
          width: w, height: h, mobile: m, screenshot: [320, 390, 1366].includes(w) });
      }
    }
  }

  for (const media of [
    [{ name: "prefers-reduced-motion", value: "reduce" }],
    [{ name: "forced-colors", value: "active" }],
  ]) {
    tick(); await runProbe({ url: BASE + "/", label: "/", width: 1366, height: 900, media });
    tick(); await runProbe({ url: BASE + "/enquiry", label: "/enquiry", width: 1366, height: 900, media });
  }
  for (const route of ["/", "/enquiry", "/admin/login"]) {
    tick(); await runProbe({ url: BASE + route, label: route, width: 1366, height: 900, rootFs: "24px" });
  }

  await writeFile(path.join(OUT, "audit-results.json"), JSON.stringify(results, null, 2));
  console.log(`\\nDone: ${results.length} probes -> ${OUT}/audit-results.json`);
}

const { proc, wsUrl } = await startEdge();
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
await mkdir(path.join(OUT, "evidence"), { recursive: true });
await main(new Cdp(ws));
proc.kill();
process.exit(0);
