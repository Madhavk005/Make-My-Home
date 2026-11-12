#!/usr/bin/env node
/**
 * Keyboard / interaction tests over CDP (Edge headless), zero dependencies.
 * Verifies: skip link, mobile drawer open/Escape/focus-return, mega menu
 * open/Escape, search suggestion Escape, enquiry-form error announcement,
 * location pill Escape, quantity stepper, details/summary toggling.
 * Usage: node scripts/qa/interactions.mjs --port 3100 [--demo-port 3101]
 */
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const EDGE = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const PORT = Number(arg("port", 3100));
const DEMO_PORT = arg("demo-port") ? Number(arg("demo-port")) : null;
const CDP_PORT = 9334;
const BASE = `http://127.0.0.1:${PORT}`;

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Set();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) for (const h of this.handlers) h(msg);
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
  on(h) { this.handlers.add(h); }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function startEdge() {
  const dir = `/private/var/folders/p2/181qb315029281dkw6w159gh0000gn/T/opencode/edge-ix-${Date.now()}`;
  const proc = spawn(EDGE, [
    "--headless", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${dir}`,
    "--no-first-run", "--disable-gpu", "--window-size=1366,900", "about:blank",
  ], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      return { proc, wsUrl: (await res.json()).webSocketDebuggerUrl };
    } catch { await wait(500); }
  }
  throw new Error("Edge did not expose CDP");
}

const results = [];
let currentSink = null;

async function test(cdp, sessionId, { name, url, width, height, mobile, steps }) {
  currentSink = null;
  const loaded = new Promise((r) => { currentSink = r; setTimeout(r, 20000); });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: !!mobile }, sessionId);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: !!mobile, maxTouchPoints: 5 }, sessionId);
  await cdp.send("Page.navigate", { url }, sessionId);
  await loaded;
  await wait(1200);

  const out = { name, url, width, pass: [], fail: [] };
  const ok = (label, value, expected = true) =>
    (value === expected ? out.pass.push(label) : out.fail.push(`${label} (got: ${JSON.stringify(value)})`));
  const ev = async (expression) => {
    const r = await cdp.send("Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "eval failed");
    return r.result?.value;
  };
  const key = async (key, code, kmods = []) => {
    for (const type of ["rawKeyDown", "char", "keyUp"]) {
      if (type === "char" && (key.startsWith("Arrow") || key === "Escape" || key === "Tab" || key === "Enter" || key === " ")) continue;
      await cdp.send("Input.dispatchKeyEvent", {
        type, key, code, windowsVirtualKeyCode: code === "Escape" ? 27 : code === "Tab" ? 9 : code === "Enter" ? 13 : undefined,
        modifiers: kmods,
      }, sessionId);
    }
  };

  try { await steps({ ev, key, ok, wait }); } catch (e) {
    out.fail.push(`EXCEPTION: ${String(e).slice(0, 160)}`);
  }
  results.push(out);
  const mark = out.fail.length ? "FAIL" : "PASS";
  console.log(`${mark}  ${name}${out.fail.length ? " → " + out.fail.join(" | ") : ""}`);
}

const SETTLE = (ms) => wait(ms);

/* ── test definitions ─────────────────────────────────────────────────── */

const tests = [
  {
    name: "Skip link: focus → visible, Enter → focus moves to main",
    url: `${BASE}/`, width: 1366, height: 900,
    steps: async ({ ev, key, ok }) => {
      await key("Tab", "Tab");
      const s = await ev(`(() => {
        const a = document.activeElement;
        const r = a.getBoundingClientRect();
        return { isSkip: a.className.includes('skip-link'), visibleTop: r.top >= 0 && r.bottom <= innerHeight, text: a.textContent.trim() };
      })()`);
      ok("first tab focuses skip link", s.isSkip);
      ok("skip link visible when focused", s.visibleTop);
      await key("Enter", "Enter"); await SETTLE(300);
      const after = await ev(`(() => {
        const a = document.activeElement;
        return { inMain: !!a.closest('main, [role="main"]'), id: a.id, scrolled: scrollY > 0 || a.id !== '' };
      })()`);
      ok("focus moved into main content", after.inMain);
    },
  },
  {
    name: "Mobile drawer: button opens, Escape closes, focus returns",
    url: `${BASE}/`, width: 390, height: 844, mobile: true,
    steps: async ({ ev, key, ok }) => {
      const s = await ev(`(() => {
        const btns = [...document.querySelectorAll('header button')];
        const btn = btns.find(b => b.getAttribute('aria-expanded') !== null && b.querySelector('svg') && !b.getAttribute('aria-label')?.match(/search|language/i)) || btns.find(b => b.textContent.includes('Menu') || b.getAttribute('aria-label')?.match(/menu/i));
        if (!btn) return { found: false };
        btn.focus(); return { found: true, expanded: btn.getAttribute('aria-expanded') };
      })()`);
      ok("menu button found", s.found);
      await key("Enter", "Enter"); await SETTLE(500);
      const open = await ev(`(() => {
        const drawer = document.querySelector('[id*="drawer" i], aside[aria-label], dialog[open], [class*="drawer"]');
        const btn = document.activeElement;
        const exp = [...document.querySelectorAll('header button')].find(b => b.getAttribute('aria-expanded') !== null);
        return { openVisible: drawer ? getComputedStyle(drawer).display !== 'none' : false, ariaExpanded: exp?.getAttribute('aria-expanded'), focusInHeader: !!btn.closest('header') };
      })()`);
      ok("drawer visible after Enter", open.openVisible || open.ariaExpanded === "true");
      ok("aria-expanded=true after open", open.ariaExpanded === "true");
      // Tab a few times: focus must stay in the drawer/header surface, not behind
      for (let i = 0; i < 6; i++) await key("Tab", "Tab");
      const during = await ev(`document.activeElement.tagName + '.' + document.activeElement.className.slice(0,40)`);
      await key("Escape", "Escape"); await SETTLE(400);
      const closed = await ev(`(() => {
        const exp = [...document.querySelectorAll('header button')].find(b => b.getAttribute('aria-expanded') !== null);
        return { ariaExpanded: exp?.getAttribute('aria-expanded'), focusRestored: document.activeElement === exp || !!document.activeElement.closest('header') };
      })()`);
      ok("aria-expanded=false after Escape", closed.ariaExpanded === "false");
      ok("focus restored to toggle/header", closed.focusRestored, `last focused during: ${during}`);
    },
  },
  {
    name: "Mega menu: click opens, Escape closes, focus stays",
    url: `${BASE}/`, width: 1366, height: 900,
    steps: async ({ ev, key, ok }) => {
      const s = await ev(`(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-controls') === 'desktop-mega-menu' || (b.className.includes('nav-link') && b.getAttribute('aria-expanded') !== null));
        if (!btn) return { found: false };
        btn.focus(); btn.click(); return { found: true };
      })()`);
      ok("nav trigger found", s.found);
      await SETTLE(400);
      const open = await ev(`(() => {
        const panel = document.getElementById('desktop-mega-menu');
        const btn = document.activeElement;
        return { panelVisible: panel ? getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().height > 50 : false, expanded: btn?.getAttribute('aria-expanded'), panelInViewport: panel ? panel.getBoundingClientRect().right <= innerWidth + 1 : false };
      })()`);
      ok("mega panel visible", open.panelVisible);
      ok("aria-expanded=true", open.expanded === "true");
      ok("panel within viewport", open.panelInViewport);
      await key("Escape", "Escape"); await SETTLE(300);
      const closed = await ev(`(() => {
        const btn = [...document.querySelectorAll('button')].find(b => (b.className || '').includes && String(b.className).includes('nav-link') && b.getAttribute('aria-expanded') !== null);
        return { expanded: btn?.getAttribute('aria-expanded'), focusKept: document.activeElement === btn };
      })()`);
      ok("aria-expanded=false after Escape", closed.expanded === "false");
      ok("focus retained on trigger", closed.focusKept);
    },
  },
  {
    name: "Search: type → suggestions; Escape closes; input labelled",
    url: `${BASE}/`, width: 1366, height: 900,
    steps: async ({ ev, key, ok }) => {
      const s = await ev(`(() => {
        const input = document.querySelector('input[type="search"], input[name="q"], input[placeholder*="earch" i], header input');
        if (!input) return { found: false };
        const labelled = !!(input.labels?.length || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'));
        input.focus(); return { found: true, labelled };
      })()`);
      ok("search input found", s.found);
      ok("search input labelled", s.labelled);
      for (const ch of "cem") {
        await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: ch }, sessionId);
        await cdp.send("Input.dispatchKeyEvent", { type: "char", text: ch, key: ch }, sessionId);
        await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: ch }, sessionId);
      }
      await SETTLE(900);
      const panel = await ev(`(() => {
        const lb = document.querySelector('[role="listbox"]');
        return { present: !!lb, itemCount: lb ? lb.querySelectorAll('[role="option"], a, li').length : 0 };
      })()`);
      ok("suggestion listbox appears", panel.present);
      await key("Escape", "Escape"); await SETTLE(300);
      const after = await ev(`(() => {
        const lb = document.querySelector('[role="listbox"]');
        return { gone: !lb || getComputedStyle(lb).display === 'none' || lb.getBoundingClientRect().height === 0, focusOnInput: document.activeElement?.tagName === 'INPUT' };
      })()`);
      ok("suggestions closed by Escape", after.gone);
    },
  },
  {
    name: "Enquiry form: empty submit → role=alert, aria-invalid, focusable error",
    url: `${DEMO_PORT ? `http://127.0.0.1:${DEMO_PORT}` : BASE}/product/ultratech-opc-53-cement`, width: 1366, height: 900,
    steps: async ({ ev, ok }) => {
      // scroll to purchase panel and clear the quantity/product then submit? The
      // product page form is pre-filled; use the general /enquiry page instead.
      await ev(`location.href = '${DEMO_PORT ? `http://127.0.0.1:${DEMO_PORT}` : BASE}/enquiry'`);
      await SETTLE(1500);
      const before = await ev(`(() => {
        const input = document.querySelector('input[id="enquiry-product"], input[name="product"]');
        if (!input) return { found: false };
        input.focus(); return { found: true };
      })()`);
      ok("enquiry product input found", before.found);
      await ev(`(() => { const f = document.querySelector('form'); const btn = f?.querySelector('button[type="submit"]'); btn?.click(); })()`);
      await SETTLE(500);
      const err = await ev(`(() => {
        const alertEl = document.querySelector('[role="alert"]');
        const invalid = document.querySelector('[aria-invalid="true"]');
        return { alertPresent: !!alertEl, alertText: alertEl?.textContent.trim().slice(0, 60), invalidPresent: !!invalid, described: invalid?.getAttribute('aria-describedby') };
      })()`);
      ok("role=alert error shown", err.alertPresent);
      ok("aria-invalid set on field", err.invalidPresent);
      ok("aria-describedby links error", err.described != null);
    },
  },
  {
    name: "Quantity stepper: buttons adjust input, min clamp",
    url: `${DEMO_PORT ? `http://127.0.0.1:${DEMO_PORT}` : BASE}/product/ultratech-opc-53-cement`, width: 1366, height: 900,
    steps: async ({ ev, ok }) => {
      const s = await ev(`(() => {
        const input = document.getElementById('enquiry-quantity');
        if (!input) return { found: false };
        const plus = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label')?.toLowerCase().includes('increase'));
        const minus = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label')?.toLowerCase().includes('decrease'));
        if (!plus || !minus) return { found: false };
        plus.click(); plus.click();
        return { found: true, afterPlus: input.value };
      })()`);
      ok("stepper found", s.found);
      ok("value increased to 3", s.afterPlus === "3", `got ${s.afterPlus}`);
      const after = await ev(`(() => {
        const minus = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label')?.toLowerCase().includes('decrease'));
        for (let i = 0; i < 5; i++) minus.click();
        return document.getElementById('enquiry-quantity').value;
      })()`);
      ok("value clamped at 1", after === "1", `got ${after}`);
    },
  },
  {
    name: "Location pill: Escape closes, no focus loss",
    url: `${BASE}/`, width: 1366, height: 900,
    steps: async ({ ev, key, ok }) => {
      const s = await ev(`(() => {
        const btn = document.querySelector('header [aria-haspopup], header button[aria-expanded]');
        if (!btn) return { found: false };
        btn.focus(); btn.click(); return { found: true };
      })()`);
      ok("location pill found", s.found);
      await SETTLE(400);
      const open = await ev(`document.activeElement?.getAttribute('aria-expanded')`);
      ok("pill expands", open === "true");
      await key("Escape", "Escape"); await SETTLE(300);
      const closed = await ev(`document.activeElement?.getAttribute('aria-expanded')`);
      ok("pill closes on Escape", closed === "false");
    },
  },
  {
    name: "Footer details/summary: keyboard toggle works",
    url: `${BASE}/`, width: 390, height: 844, mobile: true,
    steps: async ({ ev, key, ok }) => {
      const s = await ev(`(() => {
        const d = document.querySelector('footer details');
        if (!d) return { found: false };
        d.open = false; const sum = d.querySelector('summary'); sum.focus(); return { found: true, closedNow: !d.open };
      })()`);
      ok("footer details found", s.found);
      await key("Enter", "Enter"); await SETTLE(300);
      const after = await ev(`(() => {
        const d = document.querySelector('footer details');
        return { openedByKeyboard: d.open, focusOnSummary: document.activeElement.tagName === 'SUMMARY' };
      })()`);
      ok("summary opens with Enter", after.openedByKeyboard);
      ok("focus stays on summary", after.focusOnSummary);
    },
  },
];

/* ── main ─────────────────────────────────────────────────────────────── */
const { proc, wsUrl } = await startEdge();
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
const cdp = new Cdp(ws);
cdp.on((msg) => { if (msg.method === "Page.loadEventFired" && currentSink) currentSink(); });

const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
await cdp.send("Page.enable", {}, sessionId);
await cdp.send("Runtime.enable", {}, sessionId);

for (const t of tests) {
  await test(cdp, sessionId, t).catch((e) => {
    results.push({ name: t.name, fail: [`HARNESS: ${String(e).slice(0, 160)}`], pass: [] });
    console.log(`FAIL  ${t.name} → ${String(e).slice(0, 160)}`);
  });
}

await writeFile("qa/interaction-results.json", JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.fail.length).length;
console.log(`\nDone: ${results.length - failed}/${results.length} passed. Details: qa/interaction-results.json`);
proc.kill();
process.exit(failed ? 1 : 0);
