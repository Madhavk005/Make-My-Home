# Make My Home — storefront design notes

This document records the design decisions implemented in the storefront. It is
written for developers, content editors and reviewers. Business facts, prices,
product names, categories, photographs and contact details still come only from
Sanity or an approved import file; this document does not supply them.

## Who the storefront is for

Customers may be first-time online shoppers in villages and small towns. Many
prefer Hindi. The design therefore assumes:

- A small Android phone on a slow or intermittent connection.
- A shopper who may not know technical terms or how filters work.
- A journey of **श्रेणी चुनें → सामान चुनें → मात्रा भरें → WhatsApp / Call करें**.
- No account, no online payment and no checkout.

## Design concept: “Material House”

The storefront is presented as a warm, contemporary Indian building-materials
showroom rather than a generic ecommerce grid. The visual language combines:

- **Editorial calm** — generous ivory space, serif display type and quiet rules.
- **Material honesty** — earthy colour, visible structure and labelled material
  studies instead of glossy stock photography.
- **Shop practicality** — large taps, clear Hindi labels and contact actions that
  never disappear behind a menu.

The name “Material House” is used as a small editorial motif in the hero and
image captions. It is not a replacement business name.

## Visual language

The palette is warm, practical and high-contrast rather than promotional.

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#f7f3ea` | Page background |
| `surface` | `#fcfaf5` | Cards, panels, inputs |
| `sand` | `#efe7d9` | Section bands, image placeholders |
| `sand-deep` | `#e2d6c2` | Stronger sand fills |
| `ink` | `#1b2a22` | Primary text, primary buttons |
| `ink-soft` | `#56645b` | Secondary text |
| `ink-faint` | `#8b958d` | Metadata and helper text |
| `forest` | `#1e3a2f` | Header bar, dark panels, primary actions |
| `forest-deep` | `#13251c` | Footer and deepest contrast |
| `clay` | `#b4552d` | Accent, links, selected states |
| `clay-dark` | `#8f3f1d` | Accent hover |
| `brass` | `#b08a4a` | Fine rules, eyebrows, quiet detail |
| `line` | `#ddd3c3` | Borders and dividers |
| `whatsapp` | `#2f6b4f` | WhatsApp actions and confirmed states |

Compatibility aliases (`paper`, `accent`, `moss`) remain for older utilities,
but new work should use the Material House names.

## Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display | Fraunces + Noto Serif Devanagari | Headlines and editorial numerals |
| Body | Manrope + Mukta | English and Devanagari body copy |
| Metadata | Geist Mono | SKUs, material-study captions and small labels |

- Display type is tight, medium-weight and slightly editorial; it is never used
  for long paragraphs.
- Hindi line height is kept generous because Devanagari needs more vertical
  room than Latin text.
- Numbers, units and SKUs use the monospace face so quantities and codes are
  easy to scan.

## Layout and touch targets

- Content is centred with a maximum width of `80rem` and 16–32px side padding.
- Primary actions and navigation rows are at least 44–48px tall (`min-h-11` /
  `min-h-12`).
- Product and category grids are two columns on small phones, then three or
  four on larger screens.
- Body copy is never smaller than 14px; key prices use 24–30px.
- Buttons pair an icon with a text label. Icons alone are not used for actions.
- There are no hover-only controls. Menus, filters and variant pickers work with
  tap, keyboard and screen readers.
- A fixed bottom navigation on mobile keeps **Home, Categories, Search and List**
  one tap away. It is offset for iOS safe areas and hidden in print.

## Navigation

- The home page leads with a prominent search box and large, labelled category
  tiles. A shopper can browse without typing.
- Desktop has a mega-menu grouped by build stage: foundation and structure,
  finishing, and electrical and plumbing.
- Mobile has a full-height drawer portalled outside the blurred header, with
  nested accordions, a clear close action, focus trapping and contact actions at
  the bottom.
- Every category and product page has breadcrumbs and an obvious “back” link to
  the parent section.
- The language switch (हिंदी / English) is always visible in the header utility
  bar. It persists in the `mmh-locale` cookie.

## Language

- Hindi is the default, with English available from the header.
- Customer-facing UI labels live in `src/lib/i18n.ts`. Business-written copy
  lives in Sanity Site settings.
- Every business-written field has an optional English variant
  (`taglineEn`, `addressEn`, `serviceAreaEn`, `openingHoursEn`,
  `announcementEn`, `priceNoteEn`, `footerNoteEn`). Hindi remains the source of
  truth and the fallback when English is missing.
- `src/lib/settings.ts` resolves the correct version for the current locale.
- The root `<html lang>` follows the selected locale (`hi-IN` or `en-IN`).
- Brand names, model names, SKUs and specification values are shown exactly as
  supplied and are not translated.
- The Hindi wording needs review by a fluent speaker before launch. See
  `README.md` for the review checklist.

## Prices and availability

- A price is never shown without a unit: “₹___ / बोरी”, “₹___ / मीटर”.
- `fixed` prices are shown only when a positive amount exists.
- `on_request` shows “कीमत पूछें” / “Price on request”.
- `not_supplied` shows “दुकान से कीमत पता करें” / “Ask the shop for the price”.
- Zero, missing or inferred prices are never rendered as a real price.
- Availability is shown as confirmed, on request, unavailable or not confirmed.
  Only `available` and `unavailable` are treated as confirmed states.
- Variants can override price, unit and availability. The selected variant is
  always reflected in the price panel and the enquiry message.
- A product with no variants reports its selling unit rather than a fake
  “1 variant”.

## Imagery and honesty

- The bundled photographs in `public/images/` are atmospheric placeholders, not
  the client’s shop or products.
- Products without photographs show an abstract, locally generated material
  study from `public/material/`, labelled as a material study.
- The interface never presents a stock photograph as the actual product.
- No review count, star rating, discount, stock number, delivery promise or
  “best seller” claim is generated when the business has not supplied it.

## Homepage structure

1. Announcement bar with language switch, service area and phone.
2. Editorial hero with a large headline, search, category CTA and direct
   WhatsApp/call actions.
3. A scrolling material word-band.
4. Build-stage collections (structure, finishing, services).
5. A visual category index for the ten primary sections.
6. Featured products, only when the business has marked products as featured.
7. A three-step “how it works” section.
8. Brand strip.
9. Shop visit/contact panel with address, hours and service area.
10. A clear demo-mode notice when Sanity is not configured.

## Enquiry journey

- A product page shows the selected variant, quantity, unit and an indicative
  total when a fixed price exists.
- “WhatsApp पर पूछें” opens a prefilled message containing the product, brand,
  SKU, selected variant/attributes, quantity, unit and price status.
- “कॉल करें” is always available when a phone number is configured.
- The enquiry list is stored only in the browser (`localStorage`) and can be
  printed as an indicative estimate. It is not an order or a quotation.
- The WhatsApp message is generated in the selected language. English messages
  are only used when the visitor has switched to English.
- No account is required to browse or enquire.

## States

The storefront has explicit states for:

- Loading (search results, enquiry list hydration).
- Empty catalogue and empty category.
- No search results, with a clear way to clear filters.
- Missing or failed images (labelled material study, never a fake product photo).
- Price on request and price not supplied.
- Availability not confirmed.
- Network error with retry (`error.tsx`) and an offline/connection banner.
- Record-level 404 and unmatched-route 404.
- Demo mode, clearly labelled on the home page, search results, category pages
  and demo product cards.

## Performance and low-network behaviour

- Product queries are paginated server-side; the client never downloads the
  whole catalogue to filter it.
- Search is debounced and only runs on submit or after the debounce.
- Images use `next/image` with Sanity CDN sizing, lazy loading by default and a
  lower quality setting. Missing images fall back to a material study.
- Animation is limited to short colour/transform transitions and a single hero
  rise. Smooth scrolling and animations are disabled under
  `prefers-reduced-motion`.
- Pages remain usable while images load; text and actions do not wait for media.

## Accessibility

- Semantic headings, lists, fieldsets/legends and breadcrumb navigation.
- Visible `:focus-visible` outline using the clay accent.
- Variant selection uses a radio group with `aria-checked`.
- Mobile navigation uses dialog semantics, Escape to close, focus trapping and
  focus restoration.
- Filter forms use unique IDs in their mobile and desktop copies.
- Error and empty states use readable text, not colour alone.
- Contrast targets the WCAG AA level for body text and controls.
- Print styles hide navigation and chrome and keep the enquiry estimate legible.

## Open design questions

These need business or user input before they can be treated as final:

- Approved top-level sections and subcategory names.
- Approved Hindi wording, reviewed by a fluent speaker.
- Approved English wording for business-written copy.
- Real category images and product photography.
- Confirmation of the business WhatsApp number, phone number, address, opening
  hours and service area.
- Results of the uncoached usability test with 3–5 representative customers.
