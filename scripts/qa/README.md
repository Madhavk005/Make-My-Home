# QA harness (zero-dependency)

Multi-viewport responsive + accessibility audit driven over the Chrome DevTools
Protocol using the locally installed Microsoft Edge (headless). No npm packages
are added — Node's built-in `fetch`/`WebSocket` do everything.

## Usage

```
npm run build                       # production build first
npm run start -- -p 3100            # real-data server
# optional, for product-detail coverage (uses the app's own demo fallback):
ALLOW_DEMO_DATA=true npm run start -- -p 3101

node scripts/qa/audit.mjs --port 3100 [--out qa/evidence] [--demo-port 3101]
```

## What it does per (route × viewport)

- Emulates the exact viewport (device metrics, touch + mobile UA for phones).
- Detects horizontal overflow and names the offending elements.
- Detects broken images, images without alt, sub-11px computed text,
  interactive elements smaller than 24×24 CSS px, unlabelled form controls.
- Checks heading structure, landmarks, `<html lang>`, skip link.
- Records console errors / uncaught exceptions / failed network requests.
- Samples LCP and CLS from the PerformanceObserver buffer.
- Saves JPEG screenshots for the key widths (320/390/768/1024/1366/1920).

## Media / zoom passes (homepage + enquiry)

- `prefers-reduced-motion: reduce` and `forced-colors: active` emulation.
- Root font-size raised to 24px (simulates increased default text size /
  browser text zoom) and re-checked for overflow.

Outputs `qa/audit-results.json` and `qa/audit-report.md`.

## Keyboard / interaction tests

```
node scripts/qa/interactions.mjs --port 3100 [--demo-port 3101]
```

Drives real keyboard events over CDP and verifies: skip-link focus, mobile
drawer open/Escape/focus-return + focus trap, mega menu open/Escape, search
suggestion Escape, enquiry-form `role="alert"` + `aria-invalid`, quantity
stepper clamping, location pill Escape, footer `details/summary` keyboard
toggle. Writes `qa/interaction-results.json`.


Note: protected `/admin/*` pages require credentials that are not available in
this environment; only `/admin/login` is audited. Real devices (iOS/Android),
Safari/Firefox engines and production-network Core Web Vitals cannot be tested
here and are documented as limitations in the final report.
