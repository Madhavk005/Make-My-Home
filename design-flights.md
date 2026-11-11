# Flight Booking — Implementation-Ready UI Design Guidance

**Product surface:** marketing site — “Flight Booking, Cheap Flights, Air Ticket Booking at Lowest Airfare”
**Reference URL:** https://www.makemytrip.com/flights/ (SEM landing page)
**Audience:** buyers, teams, and decision-makers (**low-confidence inference — see Verification Status)
**Target conformance:** WCAG 2.2 AA
**Status:** Draft for design/engineering sign-off. Derived tokens are explicitly flagged and must be verified before freeze.
**Companion file:** this document is standalone guidance for the flights marketing surface. It does not restyle the “Make My Home” storefront described in `design.md`.

---

## 1. Context and goals

### 1.1 Design intent (one sentence)

Deliver a clean, functional, implementation-oriented marketing surface for flight search and fare discovery — Lato at 12px bold, a near-monochrome grey/black palette with a single blue accent, generous section rhythm, and component rules dense enough to keep ~430 links, 47 cards and a 6-field search form consistent, accessible and fast to ship.

### 1.2 Surface reality (measured component density)

The reference page is a long, link-dense SEM landing page, not an app. Component counts drive the entire guidance below:

| Component type | Instances | Consequence |
| --- | --- | --- |
| Links | 432 | Link accessibility (unique names, contrast, target size) is the highest-risk area on the page |
| Cards | 47 | Card structure and statefulness must be templated, never hand-rolled per section |
| Lists | 21 | Route/SEO link lists must use semantic list markup and multi-column layout |
| Buttons | 14 | Button variants are few; invent nothing beyond the variant set in §3.4 |
| Inputs | 6 | One search form; every input rule in §3.7 is mandatory |
| Navigation | 1 | A single header navigation region; footer link columns count as lists/links |

### 1.3 Goals

1. **Consistency over local exceptions.** Teams must prefer the system over one-off styling. New components must reuse tokens.
2. **Accessibility is a build requirement, not a QA afterthought.** Every component rule in §3 states keyboard, pointer and touch behavior.
3. **Fast delivery.** Tokens map 1:1 to CSS custom properties (§2.10) so implementation is copy-paste, not interpretation.
4. **Claim integrity.** Marketing copy about “lowest airfare” must remain verifiable (see §5 and §6).

### 1.4 Verification status (extraction diagnostics)

The token extraction is partial. Before treating this document as frozen, the team **must** verify:

| Item | Status | Action |
| --- | --- | --- |
| Audience inference (buyers, teams, decision-makers) | **Low confidence** | Validate against analytics/CRM; over-index on leisure + budget business travelers until data confirms. Keep both personas viable in layouts. |
| Product surface inference (marketing site) | Low confidence | Confirm scope excludes logged-in booking/payment flows, or fork a second token set for those surfaces |
| Radius, shadow, motion tokens | Not extracted | Proposed manually in §2.7–2.9 — **must** be signed off by brand |
| `font.lineHeight.base = 12px` on `font.size.base = 12px` | Extracted | Single line-height for a 12px UI label is workable for one-line labels; long-form reading needs §2.5 derived line-heights |
| `space.5`–`space.8` fractional values (45.05 / 104.23 / 185.58 / 191.38 px) | Extracted, measured | Implemented exactly per §2.6, or normalized to whole pixels with design sign-off; no other rounding is permitted |
| `color.text.tertiary = #008cff` | Extracted | **Fails AA for normal-size text on light surfaces (3.39:1).** Restricted usage defined in §2.3 — do not use for body/link text on `#ffffff` or `#f2f2f2` |

---

## 2. Design tokens and foundations

**Token naming:** dot-separated semantic names (`color.text.primary`). In code these map to CSS custom properties in kebab-case (`--color-text-primary`), never to raw hex values. Components **must** reference semantic tokens; raw hex values in component styles are prohibited (§6).

"Must" = non-negotiable. "Should" = strong recommendation; deviations require documented design-system review.

### 2.1 Color tokens — extracted (source of truth)

| Token | Value | Use | Contrast (verified) |
| --- | --- | --- | --- |
| `color.text.primary` | `#4a4a4a` | Body, headings, labels, prices on light surfaces | 8.86:1 on `#ffffff` · 7.92:1 on `#f2f2f2` |
| `color.surface.base` | `#000000` | Dark masthead, dark footer, inverted sections | — |
| `color.text.inverse` | `#ffffff` | All text/icons on `color.surface.base` | 21.00:1 on `#000000` |
| `color.text.tertiary` | `#008cff` | **Only** the following: focus ring; large text (≥24px, or ≥18.66px bold) on light; links on black; non-text accents | 3.39:1 on `#ffffff` ✗ AA-text · 3.03:1 on `#f2f2f2` ✗ AA-text · 6.20:1 on `#000000` ✓ · 3.39:1 vs white (passes 3:1 non-text) |
| `color.surface.muted` | `#f2f2f2` | Muted bands, zebra fills, skeletons, disabled fills | — |

Hard constraints derived from the verified contrast math:

- `color.text.primary` **must never** be used on `color.surface.base` (2.37:1 — fails AA). On black use `color.text.inverse`.
- `color.text.inverse` **must never** be used on `#ffffff` or `color.surface.muted` (1.00:1 / 1.12:1 — fails AA).
- `color.text.tertiary` on light surfaces **must not** carry normal-size text. See derived `color.text.link` instead.

### 2.2 Color tokens — derived (proposed; verify before freeze)

These do not exist in the extraction but are required to make the system safe to implement. They are flagged **DERIVED** and must be approved by design.

| Token | Proposed value | Use | Contrast (verified) |
| --- | --- | --- | --- |
| `color.text.link` | `#0068c9` | Link text on light surfaces | 5.49:1 on `#ffffff` · 4.91:1 on `#f2f2f2` ✓ AA |
| `color.text.linkHover` | `#005a8f` | Link hover/active on light | 7.34:1 on `#ffffff` ✓ |
| `color.text.linkOnDark` | `#4da3ff` | Links on `color.surface.base` | 8.00:1 on `#000000` ✓ |
| `color.action.primary` | `#0068c9` | Filled primary button background | white label on it: 5.49:1 ✓ |
| `color.action.primaryHover` | `#005a8f` | Filled primary, hover/active | 7.34:1 vs white ✓ |
| `color.action.primaryActive` | `#0b3b5c` | Filled primary, pressed | ≥ 9:1 vs white ✓ |
| `color.text.secondary` | `#767676` | Secondary/meta text on light | 4.54:1 ✓ AA |
| `color.text.error` | `#b3261e` | Error text and error icon on light | 6.54:1 ✓ |
| `color.text.success` | `#1e6b3c` | Success text on light | ≥ 4.5:1 target — **must verify** |
| `color.border.default` | `#8f8f8f` | Input boundaries, control outlines (SC 1.4.11 needs ≥ 3:1) | 3.23:1 ✓ non-text |
| `color.border.hairline` | `#dcdcdc` | Decorative dividers only (not the sole boundary of an input) | decorative only, no requirement |
| `color.focus.ring` | `#008cff` | `:focus-visible` outline, 3px, 2px offset | 3.39:1 on white / 6.20:1 on black — passes 3:1 non-text ✓ |
| `color.surface.scrim` | `rgba(0,0,0,0.5)` | Modal/popover scrim | — |
| `color.warning.onDark` | `#ffd166` | Warning emphasis on black | 14.56:1 ✓ |

### 2.3 Color usage rules

- Text on light surfaces **must** use `color.text.primary` (default), `color.text.secondary` (secondary), `color.text.link` (interactive text) or `color.text.error` (errors). `color.text.tertiary` is prohibited for text below 18.66px bold / 24px regular on light.
- Any color-based state change **must** be paired with a non-color affordance (underline, icon, outline, label) per SC 1.4.1.
- Color tokens **must** be referenced by name in components. Raw hex, `rgb()`, named colors, or palette values are prohibited.
- Gradients **should** be limited to the hero background and must keep text contrast ≥ 4.5:1 at every point of the gradient.
- Imagery text overlays **must** use `color.surface.scrim` behind text or a solid scrim token; text on unscrimmed imagery is prohibited.

### 2.4 Typography — extracted foundation

| Token | Value |
| --- | --- |
| `font.family.primary` | `Lato` |
| `font.family.stack` | `Lato, sans-serif` |
| `font.size.base` | `12px` |
| `font.weight.base` | `700` |
| `font.lineHeight.base` | `12px` |

#### Typography scale

| Token | Size | Typical role |
| --- | --- | --- |
| `font.size.xs` | 10px | Micro-labels, legal fine print, fare qualifiers |
| `font.size.sm` | 11px | Meta text, breadcrumbs, SEO list items |
| `font.size.md` | 12px | Body, controls, labels, buttons, list copy |
| `font.size.lg` | 14px | Emphasized body, filter/segment labels |
| `font.size.xl` | 16px | Card titles, fare amounts (inline), sub-headings |
| `font.size.2xl` | 18px | Section sub-headings |
| `font.size.3xl` | 20px | Section headings |
| `font.size.4xl` | 30px | Hero/page headline, price emphasis |

Hard rules:

- Every text node **must** map to a `font.size.*` token. No arbitrary `13px`/`15px`.
- `font.weight.base = 700` is the extracted default for UI text. A derived `font.weight.regular = 400` **should** be used for paragraphs longer than ~60 words to improve readability (DERIVED — verify with brand). Heavy weights (`800`/`900`) are permitted only for price emphasis and hero numerals (`font.size.4xl`).
- Numeric/fare/tabular content **must** use `font-variant-numeric: tabular-nums` so price columns align and don’t jitter during live updates.
- `font.lineHeight.base = 12px` applies only to single-line control labels. Longer reading text **must** use a derived relaxed line height (§2.5).
- Letter-spacing for all-caps micro-labels (`font.size.xs` + `text-transform: uppercase`) **should** be `0.04em`; all other text uses `0`.

#### Typeface loading

- Lato **must** be served via `next/font/local` or `next/font/google` with `font-display: swap`; render-blocking font requests are prohibited.
- Fallback stack is exactly `Lato, sans-serif`. No system-font restacking per component.

### 2.5 Typography — derived line heights (proposed)

`font.lineHeight.base = 12px` (1.0) is extracted but is unusable for multi-line copy. Derived tokens (verify before freeze):

| Token | Value | Use |
| --- | --- | --- |
| `font.lineHeight.tight` | `1.1` | Single-line labels, buttons, tags |
| `font.lineHeight.snug` | `1.3` | Card titles, fare rows (`font.size.xl`) |
| `font.lineHeight.normal` | `1.45` | Body and multi-line copy (`font.size.md`–`lg`) |
| `font.lineHeight.loose` | `1.6` | Long-form help text |

Rules: body copy shorter than 3 lines may use `snug`; paragraphs **must** use `normal` or looser. Line-length for paragraphs **should** stay within 45–75 characters.

### 2.6 Spacing — extracted scale

| Token | Value | Typical role |
| --- | --- | --- |
| `space.1` | 5px | Icon↔label gap, tag padding, tight insets |
| `space.2` | 10px | Control padding, card inner gaps, list-item gaps |
| `space.3` | 24px | Card padding, grid gap, section-inner rhythm |
| `space.4` | 25px | Form field vertical rhythm, baseline offset between stacked sections |
| `space.5` | 45.05px | Section top/bottom padding (mobile), card media height offsets |
| `space.6` | 104.23px | Section vertical padding (desktop), hero internal rhythm |
| `space.7` | 185.58px | Hero block outer spacing, large band rhythm |
| `space.8` | 191.38px | Maximum section separation (desktop bands) |

Rules:

- Components **must** consume `space.*` tokens only. Arbitrary values (`13px`, `1.125rem`) are prohibited.
- `space.5`–`space.8` are fractional pixels measured from the rendered page. Implement exactly (`45.05px` etc.) **or** adopt the whole-pixel normalization (`45 / 104 / 186 / 191px`) — one convention **must** be chosen in the token freeze and applied everywhere. Mixed conventions are prohibited.
- `space.3` (24px) and `space.4` (25px) differ by 1px and are not interchangeable: `space.3` is the default gap; `space.4` is reserved for form-field vertical rhythm. Components **must not** substitute one for the other.
- Touch targets on mobile **must** be padded to ≥ 44×44px using space tokens around a smaller glyph; `space.1` alone never satisfies a touch target.
- Macro rhythm (`space.6`–`space.8`) **must** collapse on mobile: section padding becomes `space.5` (≤ 768px viewport).

### 2.7 Radius (defined manually — extraction failed)

| Token | Value | Use |
| --- | --- | --- |
| `radius.none` | `0` | Hairline dividers, full-bleed bands |
| `radius.sm` | `4px` | Inputs, tags, small chips |
| `radius.md` | `8px` | Buttons, fare cards |
| `radius.lg` | `16px` | Hero search panel, modal, large panels |
| `radius.pill` | `9999px` | Traveller stepper chips, segmented controls |

Inputs, buttons and cards **must** use `radius.sm`/`radius.md` respectively; mixing more than two radii in one viewport is prohibited.

### 2.8 Shadows (defined manually — extraction failed)

| Token | Value | Use |
| --- | --- | --- |
| `shadow.none` | `none` | Flat bands, hairline-separated cards |
| `shadow.sm` | `0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)` | Card resting elevation |
| `shadow.md` | `0 2px 6px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)` | Popovers, hover-elevated fare cards |
| `shadow.lg` | `0 8px 24px rgba(0,0,0,0.16), 0 24px 48px rgba(0,0,0,0.12)` | Modal, mega-menu panel |
| `shadow.focus` | `0 0 0 3px var(--color-focus-ring)` | Programmatic focus halo (see §2.9) |

Rules: shadows are for elevation, never for decoration on `color.surface.muted`. Text on `shadow`-elevated surfaces **must** remain on light or `color.surface.base` fills.

### 2.9 Motion (defined manually — extraction failed)

| Token | Value | Use |
| --- | --- | --- |
| `duration.fast` | `120ms` | Hover/press color transitions |
| `duration.base` | `200ms` | Button/card state changes, popover open |
| `duration.slow` | `320ms` | Panel/menu reveal, hero entrance |
| `easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | All standard transitions |
| `easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |

Hard requirements:

- All animation **must** be disabled or reduced to `1ms` opacity fades under `@media (prefers-reduced-motion: reduce)`. This is a pass/fail acceptance criterion (§4, AC-9).
- No auto-playing carousels, marquees, or looping hero motion. Animated trust/offer strips **must** pause on hover/focus and provide pause/stop controls if they move.
- Animations must use `transform`/`opacity` only; layout-triggering properties (`top`, `left`, `height`) are prohibited for motion.
- Focus appearance **must** use `outline: 3px solid color.focus.ring; outline-offset: 2px;` or the `shadow.focus` halo — never `outline: none` alone, and never a sub-2px indicator.

### 2.10 Z-index and implementation mapping

| Token | Value | Layer |
| --- | --- | --- |
| `z.base` | `0` | Page flow |
| `z.stickyHeader` | `100` | Sticky site header |
| `z.dropdown` | `200` | Combobox/autocomplete listboxes, traveller popover |
| `z.navPanel` | `300` | Mobile menu / mega-menu |
| `z.modal` | `400` | Dialogs (fare details, date picker on small screens) |
| `z.toast` | `500` | Toasts/alerts |

```css
:root {
  /* Extracted */
  --color-text-primary: #4a4a4a;
  --color-surface-base: #000000;
  --color-text-inverse: #ffffff;
  --color-text-tertiary: #008cff;   /* restricted — see §2.1 */
  --color-surface-muted: #f2f2f2;
  --font-family-primary: Lato;
  --font-family-stack: Lato, sans-serif;
  --font-size-base: 12px;
  --font-weight-base: 700;
  --font-line-height-base: 12px;
  --font-size-xs: 10px; --font-size-sm: 11px; --font-size-md: 12px;
  --font-size-lg: 14px; --font-size-xl: 16px; --font-size-2xl: 18px;
  --font-size-3xl: 20px; --font-size-4xl: 30px;
  --space-1: 5px; --space-2: 10px; --space-3: 24px; --space-4: 25px;
  --space-5: 45.05px; --space-6: 104.23px; --space-7: 185.58px; --space-8: 191.38px;

  /* Derived — verify before token freeze */
  --color-text-link: #0068c9;
  --color-text-link-hover: #005a8f;
  --color-text-link-on-dark: #4da3ff;
  --color-action-primary: #0068c9;
  --color-action-primary-hover: #005a8f;
  --color-action-primary-active: #0b3b5c;
  --color-text-secondary: #767676;
  --color-text-error: #b3261e;
  --color-border-default: #8f8f8f;
  --color-border-hairline: #dcdcdc;
  --color-focus-ring: #008cff;
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px; --radius-pill: 9999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / .08), 0 1px 3px rgb(0 0 0 / .06);
  --shadow-md: 0 2px 6px rgb(0 0 0 / .12), 0 4px 16px rgb(0 0 0 / .08);
  --shadow-lg: 0 8px 24px rgb(0 0 0 / .16), 0 24px 48px rgb(0 0 0 / .12);
  --duration-fast: 120ms; --duration-base: 200ms; --duration-slow: 320ms;
  --easing-standard: cubic-bezier(.2, 0, 0, 1);
  --z-sticky-header: 100; --z-dropdown: 200; --z-nav-panel: 300; --z-modal: 400; --z-toast: 500;
}
@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 1ms; --duration-base: 1ms; --duration-slow: 1ms; }
}
```

---

## 3. Component-level rules

### 3.0 Global state contract (applies to every interactive component)

Every interactive component **must** define all seven states. A component without all seven is not shippable.

| State | Required, testable behavior |
| --- | --- |
| **Default** | Token-driven resting appearance; no reliance on hover for comprehension |
| **Hover** (pointer) | Visible change (color/fill/border/underline) within `duration.fast`; **no** layout shift, size change, or content reflow; enhancement only — never the only path to information |
| **Focus-visible** | `outline: 3px solid color.focus.ring; outline-offset: 2px;` (or `shadow.focus`); visible against every surface the component may occupy (white, `#f2f2f2`, black); appears for keyboard and programmatic focus, not on mouse click |
| **Active / pressed** | Distinct pressed appearance (one step darker action fill or underlined link); uses `duration.fast` |
| **Disabled** | `color.surface.muted` fill + `color.text.secondary` label (≥ 3:1), `cursor: not-allowed`, `disabled` attribute (not `aria-disabled` alone) when the control is unreachable; if kept focusable for discovery, uses `aria-disabled="true"` + `aria-describedby` explaining why |
| **Loading** | Spinner replaces icon (label persists), `aria-busy="true"`, repeated activation blocked; for regions, skeleton fill using `color.surface.muted` pulse; never a blank or collapsing area |
| **Error** | Text (not color alone) describing cause **and** recovery; `color.text.error` + `role="alert"` (or `aria-live="assertive"`) for blocking errors; `aria-live="polite"` for deferred/form-level summaries |

Keyboard-first baseline for **every** component: logical Tab order, visible focus, `Enter`/`Space` activation semantics matching the element role, `Escape` closes popovers/menus and returns focus to the trigger.

### 3.1 Link — 432 instances (highest-risk component on the page)

**Anatomy:** `<a>` (never `<div onClick>`), accessible name, optional leading icon (decorative `aria-hidden`), optional trailing arrow icon.

**Variants:** inline text link · standalone link (nav/breadcrumb) · card-contained link (stretched-link) · link-as-button (`<a class="…">` styled as a button — activation is `Enter` only, never binds `Space`) · SEO/footer list link.

**State rules**

| State | Link behavior |
| --- | --- |
| Default (light) | `color.text.link`; inline links **must** be underlined |
| Default (on black) | `color.text.linkOnDark` or `color.text.tertiary` (both ≥ 3:1 on black; prefer `linkOnDark` for AA text) |
| Hover | `color.text.linkHover` + underline (inline) or underline appears (standalone) |
| Focus-visible | Global focus ring (§2.9) |
| Active | `color.action.primaryActive` + underline |
| Visited | May use `color.text.linkHover`; must not reduce contrast below 4.5:1 |
| Disabled | Links are never “disabled”; remove the link and render text + reason instead |
| Loading | n/a for links; see skeleton fare rows (§3.3) |
| Error | n/a for links; error is a page/section state |

**Hard rules**

- Inline links within prose **must** be distinguishable by underline or an icon of weight equal to text — color alone fails SC 1.4.1.
- Repeated identical labels are prohibited. “View fares”, “Book now”, “Details” **must** carry distinguishable accessible names (e.g., `aria-label="View fare details New Delhi to Mumbai"`), or be wrapped in a single-link card with a heading as its name.
- With 432 links per page, **every** link’s accessible name **must** be unique in context or list position. Run an automated duplicate-name check in CI (§7).
- Link text **must** describe the destination, never “click here”, “here”, “read more” unscoped.
- Long destination labels **must** truncate with ellipsis on one line or wrap to max 2 lines; URLs themselves are never displayed.
- Target size: inline prose links are exempt from SC 2.5.8 inline exception only when the surrounding text line height provides spacing; standalone links/list items **must** hit ≥ 24×24px, and list rows **should** be ≥ 44px tall on coarse pointers.
- Pointer: single click activates. Touch: no hover dependency; 10px (`space.2`) minimum separation between adjacent tappable links.
- Empty/overflow: lists of links (fare/airport lists) **must** use two columns at ≥ 768px with `column-gap: space.3` and `break-inside: avoid` on items.

### 3.2 Card — 47 instances

**Anatomy:** container · optional media (airline logo / route thumbnail) · eyebrow (airline or category, `font.size.xs`, uppercase) · title/route (e.g., “New Delhi → Mumbai”) · meta line (duration, stops, cabin) · price block (currency + `font-variant-numeric: tabular-nums` + “per adult” qualifier) · optional CTA.

**Variants:** fare card (interactive) · deal/offer card (interactive) · SEO route card (interactive) · airline card (interactive) · info/non-interactive card (no CTA, not focusable).

**State rules**

| State | Card behavior |
| --- | --- |
| Default | `color.surface.base` fill or `color.surface.muted`; hairline border or `shadow.sm`; `radius.md` |
| Hover (interactive) | `shadow.md` + border color shift to `color.border.default`; transform `translateY(-2px)` max; no size change |
| Focus-visible | Focus ring around the whole card (`border-radius: radius.md`); one focus stop per card |
| Active | Card border → `color.action.primary`; `translateY(0)` |
| Disabled (sold out / unavailable fare) | Muted fill, “Unavailable” label, price hidden; not a link; remains readable and announced as unavailable |
| Loading | Skeleton card: shimmer replaced by static `color.surface.muted` blocks under reduced motion; height reserved (no layout shift > 0.1 CLS) |
| Error | “We couldn’t load this fare.” + Refresh button; card footprint preserved |

**Interaction contract**

- If the whole card is actionable, exactly **one** interactive element exists: a single stretched link (`<a>` with `::after` covering the card) or the card root as `<a>`. Nested interactive elements (price-link inside card-link) are prohibited.
- Keyboard: `Tab` reaches the card once; `Enter` activates; `Space` does **not** activate links.
- Pointer/touch: click/tap anywhere on card activates; minimum card height 120px; media `alt` = airline or route description; decorative thumbnails `alt=""`.
- Price **must** always render currency symbol, amount, and basis (“per adult”, “incl. taxes” / “excl. taxes”). Naked amounts are prohibited.
- Long content: route names clamp to 2 lines with `-webkit-line-clamp: 2`; airline names to 1 line + ellipsis; price never shrinks below `font.size.xl`.
- Overflow on 320px: card stacks media-above-content; price block moves below meta; no horizontal scroll.
- Empty state (zero fares): render a `No fares found` panel with cause (dates sold out / route unavailable) and one recovery action (“Try flexible dates” or “Search again”) — never a silent blank grid.

### 3.3 List — 21 instances

**Anatomy:** semantic `<ul>`/`<ol>` · optional section heading (`h2`/`h3`) · items with ≥ `space.2` inner gap (`space.1` for dense SEO lists) · optional hairline dividers · optional trailing affordance (chevron) on link items.

**Variants:** SEO route/airport link list (columns) · feature/amenity checklist · ordered “how it works” steps (`<ol>`) · fare-inclusion/exclusion list · FAQ list (disclosure pattern).

**State rules**

| State | List behavior |
| --- | --- |
| Default | Transparent; dividers `color.border.hairline` |
| Hover (link items) | Item background `color.surface.muted`; text `color.text.linkHover` + underline |
| Focus-visible | Focus ring per link item; ring not clipped by list padding (`overflow: visible` on item containers) |
| Active | Item background `color.surface.muted` darkened one step via interaction state; text `color.action.primaryActive` |
| Disabled | Unavailable route/fare item rendered as plain text + “Unavailable” meta; not a link |
| Loading | Skeleton list rows (3–8 shimmer rows) matching final row height |
| Error | Row-level or list-level inline error + retry; the list container keeps its heading and min-height |

**Hard rules**

- List semantics are mandatory: plain `<div>` rows are prohibited for lists of 3+ items.
- Ordered steps **must** use `<ol>`; checklists use `<ul>` with check icons `aria-hidden` and meaningful item text.
- Multi-column link lists (≥ 30 items) **must** flow with CSS columns and remain screen-reader logical (source order = reading order; verify with a screen reader, not just visual scan).
- Empty state: “No matching routes” with a clear-filters action; never render an empty `<ul>` silently.

### 3.4 Button — 14 instances

**Anatomy:** `<button>` (or `<a class="button">` for navigation) · leading icon (optional, `aria-hidden`) · label · trailing icon/spinner.

**Variants (the complete permitted set)**

| Variant | Fill / border | Label color | Use |
| --- | --- | --- | --- |
| `button.primary` | `color.action.primary` fill | `color.text.inverse` | Search flights, Book/continue |
| `button.secondary` | transparent fill, `color.border.default` border | `color.text.primary` | Secondary actions (compare, clear) |
| `button.ghost` | transparent, no border | `color.text.link` | Low-emphasis inline actions |
| `button.dark` | `color.text.inverse` fill on `color.surface.base` | `color.surface.base` | Actions inside black bands |
| `button.destructive` | `color.text.error` fill | `color.text.inverse` | Destructive confirms (rare; cancel booking) |

**Sizes:** `button.sm` 32px high / `font.size.md` · `button.md` 40px high / `font.size.md` · `button.lg` 44–48px high / `font.size.lg` — `button.lg` is mandatory for primary mobile actions (thumb reach, SC 2.5.8).

**State rules**

| State | Primary | Secondary | Ghost |
| --- | --- | --- | --- |
| Default | `color.action.primary` | 1px `color.border.default`, transparent | Transparent |
| Hover | `color.action.primaryHover` | Border/text → `color.text.link`; bg `color.surface.muted` | bg `color.surface.muted`, text `color.text.linkHover` |
| Focus-visible | Global ring (§2.9) | Global ring | Global ring |
| Active | `color.action.primaryActive`; `translateY(0)` if hover lifted | bg `color.surface.muted`; border `color.action.primaryActive` | text `color.action.primaryActive` |
| Disabled | `color.surface.muted` fill, `color.text.secondary` label, `disabled` attr | Same pattern, ghost border `color.border.hairline` | Same pattern |
| Loading | Spinner + label persists (“Searching…”), `aria-busy="true"`, re-press blocked | Same | Same |
| Error | Form-level alert above the button; button itself re-enabled for retry | Same | Same |

**Hard rules**

- Labels **must** be verbs + object or specific action (“Search flights”, “Swap cities”, “View fare details”). “OK”, “Submit”, “Click here”, “Go” alone are prohibited.
- Label text **must never** wrap or shrink; buttons grow to fit, max width 100% with ellipsis only on ≥ 320px truncation edge cases (and `title` tooltip provided).
- `font.size.md` / `font.weight.base` (12px/700) for `sm`+`md`; `font.size.lg` for `lg`.
- Icon-only buttons **must** carry `aria-label` and hit ≥ 44×44px (e.g., the From/To swap button).
- Keyboard: `Tab`/`Shift+Tab` to reach; `Enter`/`Space` activate; order follows source order; disabled buttons are removed from Tab order.
- Pointer/touch: ≥ 44px primary targets (`button.lg`); `button.sm` (32px) is for pointer-fine contexts only and is prohibited for primary actions.
- Touch: no hover-dependent reveals of essential action labels.

### 3.5 Navigation — 1 region + breadcrumb

**Anatomy:** skip link (first focusable) → `<header>` `<nav aria-label="Primary">`: logo (home link) · primary items · one prominent action (“Sign in” or “Search”) → (desktop) optional mega-menu panel · (mobile) toggle button + full-height panel. Breadcrumb `<nav aria-label="Breadcrumb">` with `<ol>` and `aria-current="page"` on the last item.

**State rules**

| State | Nav behavior |
| --- | --- |
| Default | Logo left; items right; `color.surface.base` (black) background with `color.text.inverse` items **or** white header with `color.text.primary` items — one treatment per brand sign-off; never mixed per breakpoint |
| Hover | Item text → accent (`color.text.linkOnDark` on black; `color.text.link` on white) + underline offset `2px` |
| Focus-visible | Global ring; on black header use ring plus 2px `color.text.inverse` inner outline if ring-on-black is judged insufficient |
| Active / current | `aria-current="page"` + persistent underline or pill; color alone is not sufficient |
| Disabled | n/a — items link or don’t exist |
| Loading | n/a |
| Error | n/a |

**Hard rules**

- Exactly one `<nav>` landmark for primary navigation per page; breadcrumbs are a second landmark labelled “Breadcrumb” (the “navigation (1)” density refers to primary nav).
- The skip link is **must-have**: first Tab stop, visible on focus, jumps to `<main id="main"`>.
- Desktop mega/dropdown panels open on hover **and** focus, close on `Escape` or pointer-leave + blur, and return focus to the trigger. Optional hover intent delay ≤ 150ms.
- Mobile: toggle button has `aria-expanded` + `aria-controls`; panel is a disclosure (non-modal) unless it covers the full screen — then dialog semantics, `Escape` to close, focus trap, focus restoration. Body scroll locked while open.
- Sticky header: `z.stickyHeader`; on scroll, `shadow.md` may appear (color transition only, no height change — no layout shift).
- Current location **must** be conveyed by `aria-current="page"`, not color.
- Keyboard: all items reachable by `Tab`; arrow keys optional within menus but `Escape` must always work; focus never escapes behind an open panel.
- Touch: items ≥ 44px tall; no hover-reveal of required actions.

### 3.6 Footer link groups (counted within Lists/Links)

Columns of links grouped under headings (Popular routes, Airlines, Company, Support). Rules: headings are `<h2>`/`<h3>`, not styled spans; columns use CSS `columns` or grid; every link underlined or high-affordance; “Back to top” button at end with `aria-label="Back to top"`.

### 3.7 Input — 6 instances (the flight search form)

The six fields: **From, To, Depart, Return, Travellers, Cabin class** (and a swap control between From/To). Anatomy for every field: visible `<label>` (placeholder-as-label is prohibited) · control · leading icon (`aria-hidden`) · hint slot (`aria-describedby`) · error slot (`aria-live`).

**Field-level behavior**

| Field | Element | Behavior contract |
| --- | --- | --- |
| From / To | `role="combobox"` + `role="listbox"` | Typing filters airports/cities (IATA + local-language names); `ArrowDown/Up` moves `aria-activedescendant`; `Enter` selects; `Escape` closes; selection announces city, airport, IATA; swapping cities via “Swap origin and destination” button (`aria-label`, ≥ 44×44px, `icon` mirrored vertically on mobile when fields stack) |
| Depart | Button opening calendar popover (or native `<input type="date">` acceptable fallback) | WAI-ARIA date-picker-dialog grid; `min` = today, `max` = today + 330 days; roving tabindex on days; `Escape` closes and restores focus; range validation with Return on submit |
| Return | Same pattern as Depart; optional — “One-way” toggle removes the field and its validation | Hidden when one-way is selected; `aria-hidden` + removed from Tab order (not merely visually hidden); toggling returns focus to Depart |
| Travellers | Popover with steppers (Adults 1–9, Children 0–8, Infants ≤ Adults; total ≤ 9) | Stepper buttons have `aria-label` (“Add one adult” / “Remove one adult”), `disabled` at min/max; count announced via `aria-live="polite"`; summary line e.g. “2 Adults, 1 Child” |
| Cabin class | Listbox or native `<select>` | Economy / Premium Economy / Business / First; default Economy; selection persists via URL params for shareability |

**State rules (all inputs)**

| State | Input behavior |
| --- | --- |
| Default | White fill, 1px `color.border.default` border (≥ 3:1), `radius.sm`, `font.size.lg` label / `font.size.md` value |
| Hover | Border → `color.text.secondary`; no fill wash that reduces text contrast |
| Focus-visible | Global ring; border may also darken — ring is mandatory |
| Active (editing) | Border → `color.action.primary`; caret visible; background stays white |
| Disabled | `color.surface.muted` fill, `color.text.secondary` text, `disabled` attr; helper explains why (e.g., Return disabled in one-way mode) |
| Loading (suggestions) | Spinner inside field; prior suggestions remain visible until replaced |
| Error | Border `color.text.error` 2px + icon + text message (`color.text.error`) + `aria-describedby` to the message + `aria-invalid="true"` |

**Form-level rules**

- Label association is mandatory everywhere (`for`/`id` or wrapped). No placeholder-only fields.
- IDs **must** be unique even when the form renders twice (mobile/desktop); suffix one copy (`-m`/`-d`).
- On submit: validate synchronously; if invalid, render a form-level summary at the top (`role="alert"`) listing errors as anchor links, and move focus to the first invalid field.
- Submit button is the `button.primary.lg`, full-width on mobile; while searching, `aria-busy` and label changes to “Searching…” with a persistent spinner; results region announced via `aria-live="polite"` (“27 fares found”).
- Keyboard: no `Enter` hijacking inside comboboxes (Enter selects the highlighted option); Tab order follows visual order; focus ring always visible.
- Long content: city/airport names truncate to one line + ellipsis in the closed control, full name in the option row and in `aria-label` where needed.
- Edge cases: no route service (show inline “This route isn’t bookable right now”), past dates (prevented + message), infants without adult, and fare sold-out-on-calendar (dates disabled + reason on focus).
- Inputs on 320px stack vertically; swap button rotates 90°; calendar popover becomes full-screen modal with dialog semantics.

### 3.8 Derived patterns (compositions, not new components)

| Pattern | Composition | Non-negotiable notes |
| --- | --- | --- |
| Search panel | 6 inputs + swap + submit, on `color.surface.base` or white card | Panel radius `radius.lg`; heading `h1` is the page `h1`; persistent via URL params; results anchor focus |
| Fare/results rows | fare card list | Skeleton rows during search; error row with retry; empty state with flexible-dates recovery |
| Trust/offer strip | icon + 2-line text, non-interactive | `aria-hidden` icons; not focusable; items ≥ 44px if tappable |
| Price display | — | Always ₹ + tabular-nums; “per adult”; strikethrough only for a real, verifiable original fare; taxes qualifier visible |
| Skeletons | Static muted blocks (no shimmer under reduced motion) | Reserved heights; no CLS |
| Toast | `role="status"` bottom-center | Non-blocking; auto-dismiss ≥ 6s; persistent action if it carries one |

---

## 4. Accessibility requirements — testable acceptance criteria

WCAG 2.2 AA. Each criterion is pass/fail. “AA” = must pass on all templates (home/search, route/SEO, airline, results).

| ID | Criterion (SC) | Pass check |
| --- | --- | --- |
| AC-1 | Contrast, text (1.4.3): normal text ≥ 4.5:1; large ≥ 3:1 | axe-core or manual audit of every text node on sampled templates; zero failures. Includes the 432 links and all card prices |
| AC-2 | Non-text contrast (1.4.11): control boundaries, focus ring, icons conveying state ≥ 3:1 | Input borders measured ≥ 3:1 vs adjacent; focus ring ≥ 3:1 on white, muted and black |
| AC-3 | Use of color (1.4.1): meaning never conveyed by color alone | Inspect link underline, error icons+text, current-page indicator, selected cabin class — each has a non-color cue |
| AC-4 | Focus visible (2.4.7) + Focus appearance (2.4.11/2.4.13): unobscured, ≥ 3px ring, ≥ 3:1 | Tab through full page incl. mega-menu and calendar; 100% of controls show the ring; sticky header never obscures it |
| AC-5 | Keyboard operable (2.1.1/2.1.2): no keyboard traps | Complete “search → results → fare details” without pointer; `Escape` exits every popover; focus restores to trigger |
| AC-6 | Target size (2.5.8): ≥ 24×24px (AA); primary actions ≥ 44px recommended | Measure all buttons/link rows/list items; inline prose links exempt only with adequate line spacing |
| AC-7 | Accessible names (4.1.2 / 2.5.3): unique names | Automated uniqueness check over all link accessible names; icon-only buttons carry `aria-label`; names match visible label where a visible label exists |
| AC-8 | Error identification & suggestion (3.3.1/3.3.3) | Submit empty form: every error is text + `aria-invalid` + `aria-describedby`; error summary is `role="alert"`; focus moves to first invalid field |
| AC-9 | Reduced motion (2.3.3) | With `prefers-reduced-motion: reduce`, no transform/opacity animation > 1ms; page fully usable; no skeleton shimmer |
| AC-10 | Reflow (1.4.10): 320px width, no two-dimensional scroll | Set viewport 320×256; scroll width ≤ 320px; no clipped content except an intentionally scrolling fare table with its own label |
| AC-11 | Semantics & headings (1.3.1/1.3.2/2.4.6) | Exactly one `<h1>`; no skipped levels; `<ul>/<ol>` for lists; landmarks: banner, one primary navigation, main, contentinfo; breadcrumb labelled |
| AC-12 | Language of page (3.1.1) | `<html lang>` matches content (`en-IN` / `hi`); mixed-language fragments marked `lang` |
| AC-13 | Images (1.1.1) | Airline logos: `alt` = airline name; decorative art: `alt=""`; informative hero art: descriptive `alt` |
| AC-14 | Status messages (4.1.3) | Fare-count/loading announcements via `aria-live="polite"`; blocking errors via `role="alert"`; discoverable without focus |
| AC-15 | Consistent navigation & identification (3.2.3/3.2.4) | Search panel, header and footer appear consistently; same action = same label everywhere (“Search flights”, never “Find flights” in one place) |
| AC-16 | Label in name (2.5.3) | Accessible name includes the visible label text verbatim (voice-control compatibility) |

**Testing matrix (must all pass):** keyboard-only · NVDA + Chrome/Win · VoiceOver + Safari/macOS · VoiceOver + iOS · 400% zoom · 320px reflow · `prefers-reduced-motion` · Windows forced-colors/high-contrast.

---

## 5. Content and tone standards

**Voice:** concise, confident, implementation-focused. Short verbs, concrete nouns, no hype. Prices and claims are data, not rhetoric.

### 5.1 Rules

- Button/link text **must** name the action and object. “Search flights”, “Swap cities”, “View fare details”, “Clear filters”. Never “Click here”, “Submit”, “Okay”, unscoped “Learn more”.
- Prices **must** carry unit and basis: “₹2,340 per adult, incl. taxes”. “Lowest fare” **must** not render unless live inventory supports it; the page title/meta may say “Lowest Airfare” (SEO), but body copy must claim only what is verifiable (“Low fares on domestic routes, updated hourly”).
- Urgency/scarcity (“Only 2 seats left”, “Offer ends in 00:04:32”) is prohibited unless sourced from live inventory with a real countdown; static urgency is a fabricated claim.
- Error copy **must** state what happened + how to recover: “We couldn’t load fares for these dates. Check your connection and retry.” Never “Error 502”, “Something went wrong” with no action.
- Empty states **must** be instructive: cause + single recovery (“No fares found for 14 Mar. Try nearby dates or search a different route.”).
- Helper text for complex controls (Travellers popover) is mandatory; error text replaces, not stacks with, helper text.
- Keep UI sentences ≤ 2 lines. No paragraph marketing blocks inside components.
- Numerals: use ₹ + digit grouping Indian style (₹1,23,456) consistent with the brand’s market; times 24h with IST suffix; dates `12 Mar 2026`.
- **must**: descriptive alt text, visible labels, and non-color state cues agree with the copy they describe.

### 5.2 Examples

| Avoid | Use instead |
| --- | --- |
| “Click here to book cheap flight tickets” | “Search flights” / “Search Delhi to Mumbai flights” |
| “Lowest airfare guaranteed — book now!” | “Fares from ₹1,899*” (asterisk = “per adult, excl. taxes, on select dates”) — and only if data-backed |
| “Hurry, only 2 seats left!” | “2 seats left at this fare” (live inventory only) or omit |
| “Submit” | “Search flights” |
| “Error 500” | “We couldn’t load this fare. Retry.” |
| “No results” (dead end) | “No fares found for 14 Mar. Try flexible dates.” |
| “Travellers” (bare label, no summary) | “2 Adults, 1 Child · Economy” |
| “Amazing deals unbeatable” | “Domestic fares updated hourly” |

### 5.3 Microcopy for the search form

- From/To error: “Select a departure city.” / “Return date is before the departure date.”
- One-way toggle: “One-way” / “Round trip” (segmented control, `role="radiogroup"`).
- Cabin class helper: “Applies to all travellers in this search.”

---

## 6. Anti-patterns and prohibited implementations

1. Raw hex/rgb/hsl values in components instead of semantic tokens. **Prohibited.**
2. `color.text.tertiary` (`#008cff`) for normal-size body or link text on light surfaces (3.39:1). **Prohibited.**
3. Hidden/removed focus indicators, or focus rings below 3px / 3:1. **Prohibited.**
4. Color-only state signaling (red border with no message; yellow = warning only). **Prohibited.**
5. Placeholder text as the only label. **Prohibited.**
6. Opacity-only disabled styling. **Prohibited** — use `color.surface.muted` + `color.text.secondary`.
7. Hover-only content or hover-only navigation affordances. **Prohibited** (SC 1.4.13 / 2.1.1).
8. Nested interactive elements inside a clickable card. **Prohibited.**
9. Duplicate generic link names (“View fares” × 47). **Prohibited** — names must be unique in context.
10. One-off spacing/typography (`13px`, `18.5px`, `1.35rem`) outside tokens; token-adjacent values must use `space.*`. **Prohibited.**
11. Mixing the two spacing conventions (fractional extracted vs. normalized whole px) after token freeze. **Prohibited.**
12. Substituting `space.3` (24px) for `space.4` (25px) interchangeably. **Prohibited.**
13. `font.lineHeight.base` (1.0) on multi-line copy. **Prohibited** — use `font.lineHeight.normal`+.
14. Fabricated claims: fake countdowns, fake seat counts, fake strikethrough pricing, unverified “lowest airfare/best price” in body copy. **Prohibited.**
15. Carousels without pause/stop controls; auto-playing video/audio; motion without reduced-motion fallback. **Prohibited.**
16. `outline: none` / `outline: 0` with no replacement; `tabindex > 0`. **Prohibited.**
17. Inventing new button variants ad hoc (e.g., gradient CTA, pill-shaped neon button). **Prohibited** — extend the token system via review.
18. `div`/`span` with click handlers instead of `button`/`a`. **Prohibited.**
19. Empty `<ul>` / blank sections for no-results; silent failures. **Prohibited.**
20. Layout that shifts during load (unreserved skeleton heights, images without dimensions). **Prohibited** — reserve boxes; CLS ≤ 0.1.
21. Disabled submit buttons as the only invalid-form signal (with no message). **Prohibited** — always show why.
22. Low-contrast “legal grey” footers below 4.5:1. **Prohibited.**
23. Toast messages auto-dismissing under 4.5s or carrying sole actions. **Prohibited** for actionable toasts.
24. Raw spinners with no accessible status text. **Prohibited.**
25. Icon-only buttons without `aria-label` (including the From/To swap). **Prohibited.**

**Migration notes (ad-hoc → system):** audit the live page for the prohibited patterns above (a lintable list: hex literals, `outline:0`, `tabindex>0`, `rgba(0,0,0` outside tokens, inline `px` font sizes). Introduce tokens as CSS custom properties per §2.10 in one PR, migrate components in a second, then delete legacy values. No intermediate “local exceptions” are permitted. Because this surface is SEM-traffic-critical, redirect/URL and SEO route-list content must not be restructured during token migration.

---

## 7. QA checklist

**Tokens & foundations**
- [ ] All colors resolve to `color.*` tokens; zero raw hex in component CSS
- [ ] `color.text.tertiary` appears only in permitted roles (focus ring, large text, black surfaces, non-text)
- [ ] Spacing uses `space.*` exclusively; one fractional-or-normalized convention chosen and enforced
- [ ] Typography uses `font.size.*` / `font.weight.*` / `font.lineHeight.*`; body paragraphs ≥ `normal` line height
- [ ] Derived tokens (`color.text.link`, `color.action.primary`, `#0068c9` family, radius, shadow, motion) have design sign-off recorded
- [ ] `prefers-reduced-motion: reduce` neutralizes all motion

**Components**
- [ ] Every interactive component documents/implements default, hover, focus-visible, active, disabled, loading, error
- [ ] Focus-visible ring present on all 14 buttons, all 432 links, 6 inputs, card/stretched-links, nav items
- [ ] No nested interactives in cards; one focus stop per card
- [ ] Buttons/labels never wrap; primary mobile actions ≥ 44px
- [ ] From/To combobox: filter, `aria-activedescendant`, Enter select, Esc close, swap button labelled
- [ ] Date picker: keyboard-navigable grid, min/max enforced, Return ≥ Depart validation
- [ ] Loading states reserve height (CLS ≤ 0.1); skeletons static under reduced motion
- [ ] Empty states have cause + one recovery action; error states have cause + recovery; nothing renders blank

**Accessibility**
- [ ] AC-1 through AC-16 executed and logged pass on home/search, route SEO, airline and results templates
- [ ] axe-core (or equivalent) = 0 serious/critical violations
- [ ] Keyboard-only run-through completed and recorded (incl. calendar and travellers popover)
- [ ] Screen reader spot check: fare-count announcement, error summary, list column reading order
- [ ] 320px reflow and 400% zoom verified with screenshots
- [ ] Unique accessible names across all links (automated uniqueness check in CI)

**Content**
- [ ] No unsubstantiated lowest-fare claims; all prices carry unit + basis; strikethroughs verifiable
- [ ] No "click here"/bare "read more"; labels match their accessibile names (voice control)
- [ ] Error and empty copy follows cause + recovery pattern

**Process**
- [ ] Derived tokens and extracted-fractional spacing have an owner and a freeze date
- [ ] Audience confidence re-checked with analytics data post-launch; token set revisited if business-traveler share is material
- [ ] QA checklist attached to the release ticket; failures block launch

---

## 8. Open items requiring sign-off

1. **Audience:** “buyers, teams, decision-makers” was generated with low confidence. Confirm or re-baseline against search analytics for the SEM campaign; layout density (432 links) currently suits browse-heavy leisure/budget users.
2. **Derived palette:** the `#0068c9` family (links, primary action) is proposed to make the extracted `#008cff` AA-safe. Brand may choose an approved accessible blue; it **must** measure ≥ 4.5:1 on `#ffffff` and `#f2f2f2` and ≥ 3:1 for the focus ring on all three surfaces.
3. **Spacing normalization:** choose exact fractional (`45.05px`) or normalized (`45 / 104 / 186 / 191px`) before component migration; document the decision in the token freeze note.
4. **`font.weight.base = 700` for body text:** confirm whether long-form copy stays 700, or derived `font.weight.regular = 400` is adopted (recommended for > 60-word paragraphs).
5. **Radius/shadow/motion scales:** §2.7–2.9 are manually defined proposals; brand/design must ratify before theming ships.
6. **Claims policy:** agree the exact wording for the "Lowest Airfare" headline vs. body copy with legal/performance marketing; body claims must remain data-backed.
7. **Dark-surface scope:** confirm which sections use `color.surface.base` (masthead/footer vs. hero), since text token legality differs by surface (§2.1).

*End of guidance. Non-negotiable rules use "must"; recommendations use "should". Any exception requires a documented, reviewed change to this file — never a local style override.*
