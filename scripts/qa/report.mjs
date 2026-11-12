#!/usr/bin/env node
/** Aggregates qa/audit-results.json into qa/audit-report.md */
import { readFile, writeFile } from "node:fs/promises";

const results = JSON.parse(await readFile("qa/audit-results.json", "utf8"));
const lines = [];
const by = (fn) => {
  const map = new Map();
  for (const r of results) {
    const key = fn(r);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return map;
};
const route = (r) => `${r.route} @ ${r.width}px${r.mobile ? " (touch)" : ""}`;

/* 1. Horizontal overflow */
lines.push("## Horizontal overflow (scrollWidth > viewport)\n");
for (const [key, rs] of by(route)) {
  const bad = rs.filter((r) => r.overflowX > 1);
  if (bad.length) {
    lines.push(`- **${key}** — overflow ${bad[0].overflowX}px, scrollW ${bad[0].scrollW}`);
    for (const o of bad[0].offenders?.slice(0, 6) || []) {
      lines.push(`  - \`${o.tag}.${String(o.cls).slice(0, 70)}\` right=${o.right} left=${o.left}`);
    }
  }
}

/* 2. Console errors / failed requests */
lines.push("\n## Console errors & failed requests\n");
const errMap = by((r) => (r.console?.length || r.failedRequests?.length) ? r.route : null);
for (const [r, rs] of errMap) {
  const msgs = [...new Set(rs.flatMap((x) => [...(x.console || []), ...(x.failedRequests || []).map(f => `NET-FAIL: ${f}`)]))].slice(0, 5);
  lines.push(`- **${r}**: ${msgs.join(" | ")}`);
}
if (!errMap.size) lines.push("_None._");

/* 3. Broken images */
lines.push("\n## Broken images\n");
let any = false;
for (const r of results) {
  if (r.brokenImgs?.length) { any = true; lines.push(`- ${route(r)}: ${r.brokenImgs.join(", ")}`); }
}
if (!any) lines.push("_None._");

/* 4. Tiny text (<11px computed) */
lines.push("\n## Sub-11px computed text\n");
const tinyMap = new Map();
for (const r of results) {
  for (const t of r.tinyText || []) {
    const key = `${t.fs}px ${t.cls}`.trim();
    if (!tinyMap.has(key)) tinyMap.set(key, { ...t, where: new Set() });
    tinyMap.get(key).where.add(route(r));
  }
}
for (const [key, t] of tinyMap) {
  lines.push(`- \`${key}\` "${t.text}" — e.g. ${[...t.where].slice(0, 2).join("; ")}`);
}
if (!tinyMap.size) lines.push("_None._");

/* 5. Small targets (<24px) */
lines.push("\n## Interactive elements smaller than 24px\n");
const smallMap = new Map();
for (const r of results) {
  for (const t of r.smallTargets || []) {
    const key = `${t.tag} ${t.text} (min ${t.min})`;
    if (!smallMap.has(key)) smallMap.set(key, { ...t, where: new Set() });
    smallMap.get(key).where.add(route(r));
  }
}
for (const [key, t] of smallMap) {
  lines.push(`- ${key} — e.g. ${[...t.where].slice(0, 2).join("; ")}`);
}
if (!smallMap.size) lines.push("_None._");

/* 6. Unlabelled form controls */
lines.push("\n## Unlabelled form controls\n");
const unlabMap = new Map();
for (const r of results) {
  for (const t of r.unlabeled || []) {
    const key = `${t.tag} type=${t.type || "-"} id=${t.id || "-"} name=${t.name || "-"}`;
    if (!unlabMap.has(key)) unlabMap.set(key, { where: new Set() });
    unlabMap.get(key).where.add(route(r));
  }
}
for (const [key, t] of unlabMap) lines.push(`- ${key} — e.g. ${[...t.where].slice(0, 2).join("; ")}`);
if (!unlabMap.size) lines.push("_None._");

/* 7. A11y structure */
lines.push("\n## Structure checks\n");
const noLang = results.filter((r) => !r.lang && r.vw);
if (noLang.length) lines.push(`- Missing html lang on ${noLang.length} probes`);
const multiH1 = results.filter((r) => r.h1Count > 1);
if (multiH1.length) lines.push(`- Multiple h1: ${[...new Set(multiH1.map(route))].join("; ")}`);
const skips = results.filter((r) => r.headingSkips > 0);
if (skips.length) lines.push(`- Heading level skips: ${[...new Set(skips.map(route))].slice(0, 8).join("; ")}`);

/* 8. LCP / CLS (localhost, best-effort) */
lines.push("\n## LCP / CLS on load (localhost, warm cache)\n");
const perf = results.filter((r) => r.route === "/" && [320, 768, 1366].includes(r.width));
for (const r of perf) lines.push(`- ${route(r)}: LCP ${r.lcp}ms, CLS ${r.cls}`);
const worst = Math.max(...results.map((r) => r.cls || 0));
lines.push(`- Worst CLS observed anywhere: ${worst}`);

/* 9. Zoom 24px root */
lines.push("\n## Increased text size (24px root font) reflow\n");
for (const r of results.filter((x) => x.zoom24)) {
  lines.push(`- ${r.route}: overflowX ${r.zoom24.overflowX}px (scrollW ${r.zoom24.scrollW}, vw ${r.zoom24.vw})`);
}

/* 10. errors raised during probing */
const probeErrors = results.filter((r) => r.error);
if (probeErrors.length) lines.push(`\n## Probe errors\n${probeErrors.map((r) => `- ${r.route} @ ${r.width}: ${r.error}`).join("\n")}`);

await writeFile("qa/audit-report.md", lines.join("\n") + "\n");
console.log(`Report written: qa/audit-report.md (${lines.length} lines)`);
