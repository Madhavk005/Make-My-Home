# Make My Home

A mobile-first construction and home-building catalogue. Customers browse a
nested product taxonomy, search and filter the catalogue, pick variants and
quantities, then send one prepared enquiry to the business on WhatsApp.

The storefront is deliberately a catalogue, not a shop: there is no checkout,
payment, live stock count, loyalty scheme or ERP integration. Prices,
availability and images are only shown when the business has supplied them.

The interface is Hindi-first with an English switch. The visual language is a
warm “Material House” showroom: ivory canvas, forest green, clay and brass,
editorial serif headlines and large, rural-friendly controls.

## What is included

- Nested, CMS-managed categories with arbitrary depth, breadcrumbs and a build
  stage (structure, finishing or services) for homepage grouping.
- Products with brand, SKU, images, descriptions, unit, price status,
  availability, keywords, specifications and independently priced/stocked
  variants.
- Search across names, brands, SKUs, categories, aliases and specification
  values, with category-aware filters, sorting and server-side pagination.
- A Sanity Studio at `/studio` for staff to manage categories, brands,
  products, prices, units, images, variants and site settings. The Studio adds
  browse-by-category and browse-by-brand lists, a build-stage category view,
  recently updated products, unpublished drafts and catalogue-health lists.
- A CSV bulk import that validates rows, detects duplicates, avoids silent
  overwrites and writes a machine-readable report.
- Optional customer accounts through Better Auth. Admin access is restricted to
  the `ADMIN_EMAILS` allowlist; browsing and WhatsApp enquiries never require
  an account.
- A Hindi-first bilingual interface with an English switch. Business-written
  settings can have optional English versions; Hindi is always the fallback.
- Honest missing-data handling: explicit price statuses, labelled material
  studies for missing images, and no invented business details, discounts,
  reviews or stock numbers.
- A printable enquiry estimate and a persistent browser-local enquiry list.
- A complete demo catalogue that runs without Sanity, clearly labelled as demo
  content and isolated in `src/lib/demo-data.ts`.

## Not included

Online checkout or payments, WhatsApp Business API automation, live inventory,
credit ledgers, loyalty programmes, ERP integration and a separate product
admin. Sanity Studio is the catalogue and website CMS; the small `/admin`
console is limited to enquiry follow-up and admin access.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| CMS | Sanity 6 with `next-sanity` and `@sanity/client` |
| CSV | `csv-parse` |
| Accounts | Better Auth 1.7 |
| Database | PostgreSQL |
| Scripts | `tsx` |

Node.js 20.9 or newer is required; Node 22 LTS is recommended.

## Quick start

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL, BETTER_AUTH_SECRET and ADMIN_EMAILS.
# Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET for real content.
# Set ALLOW_DEMO_DATA=true only when reviewing the local demo catalogue.
npm run db:migrate
npm run env:check
npm run dev
```

Open <http://localhost:3000>. Without Sanity configuration the storefront
shows a setup state and no fabricated catalogue. To review the labelled demo
catalogue locally, explicitly set ALLOW_DEMO_DATA=true. Demo data is disabled
for production builds and is not a substitute for approved business content.

The Studio is at <http://localhost:3000/studio> once a real Sanity project ID is
set. Demo mode is for design review and QA only — replace it with real content
before any public launch.

Production checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

`npm run typecheck` runs `next typegen` first so typed routes stay in sync.

## Environment variables

Copy `.env.example` to `.env.local`. Keep secrets and write tokens out of source
control.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Public HTTPS origin for metadata, robots and sitemap URLs. |
| `DATABASE_URL` | Yes | PostgreSQL connection for Better Auth and enquiries; use Supabase transaction pooler on Vercel. |
| `DIRECT_URL` | Optional | Session/direct connection for Prisma CLI schema commands and as the migration runner fallback. |
| `DATABASE_MIGRATION_URL` | Optional | Overrides `DIRECT_URL` for the custom SQL migration runner. |
| `PG_POOL_MAX` | Optional | Connection pool size; defaults to 1 on Vercel and 10 elsewhere. |
| `BETTER_AUTH_SECRET` | Production | Secret used to sign Better Auth sessions. |
| `BETTER_AUTH_URL` | Optional | Server-side auth URL; defaults to `NEXT_PUBLIC_SITE_URL`. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Optional | Set only when the browser auth API uses a different origin. |
| `BETTER_AUTH_API_KEY` | Optional | Better Auth infrastructure plugin key. |
| `ADMIN_EMAILS` | Admin use | Comma-separated admin email allowlist; empty means no admin access. |
| `ALLOW_PUBLIC_SIGNUP` | Optional | Defaults to `false`; keep false in production. |
| `ALLOW_DEMO_DATA` | Local demo only | Defaults to `false`; production builds never serve demo content. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Real catalogue | Sanity project ID; without it the app shows setup state unless local demo mode is explicitly enabled. |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity | Dataset name, normally `production`. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Optional | API date, defaults to `2025-01-01`. |
| `SANITY_API_READ_TOKEN` | Private datasets only | Server-side read token. Never prefix it with `NEXT_PUBLIC_`. |
| `SANITY_API_WRITE_TOKEN` | Import scripts only | Server-side Editor token for `import:products --commit` and `seed:demo --commit`. The running website and Studio do not need it. |
| `SANITY_REVALIDATE_SECRET` | Webhook | Shared secret for `/api/revalidate`; required for instant publishing updates. |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics measurement ID. |

The WhatsApp number is **not** an environment variable. It comes from Sanity
Studio → Site settings, so there is one source of truth for the website. See
[SANITY_CMS.md](./SANITY_CMS.md) for CORS, tokens and webhook setup.

## Sanity setup

1. Create a project and dataset at <https://sanity.io/manage>.
2. Put the project ID and dataset in `.env.local`.
3. Add the exact local and production origins to the project's CORS origins.
   The embedded Studio needs credentials enabled for its sign-in session. After
   setting the project ID in `.env.local`, you can use the Sanity CLI:

   ```bash
   npx sanity cors add http://localhost:3000 --credentials
   npx sanity cors add https://your-domain.example --credentials
   ```

   Replace the example production origin with the value of `NEXT_PUBLIC_SITE_URL`.
   Do not use a wildcard for an origin that allows credentials.
4. No write token is needed for Studio or the storefront. Only the CSV import
   and optional demo seed need `SANITY_API_WRITE_TOKEN`.
5. Run `npm run dev` and open `/studio`.
6. Create **Site settings** first, including the real business name, WhatsApp
   number and storefront copy.
7. Configure the revalidation webhook so published edits appear immediately.
   Full instructions are in [SANITY_CMS.md](./SANITY_CMS.md).

### Content model

| Document | Key fields |
| --- | --- |
| Site settings | Business name, tagline, logo, WhatsApp/phone/email, address, service area, opening hours, announcement, price note, footer note, social links. Business-written fields have optional English versions (`taglineEn`, `addressEn`, `serviceAreaEn`, `openingHoursEn`, `announcementEn`, `priceNoteEn`, `footerNoteEn`). |
| Category | Name, unique slug, optional parent, build stage, description, image, suggested specification names, display order. |
| Brand | Name, unique slug, logo, description, website, display order. |
| Product | Name, unique slug, unique SKU, category, brand, descriptions, unit, price status/price, original price, availability, variants, specifications, up to 8 images, keywords, featured flag, demo flag. |

Categories and brands must exist before products can reference them. Category
slugs and product slugs are unique within their document type. The hierarchy
may be nested to 30 levels, and the Studio blocks self-parenting and circular
parent chains.

Only **published** documents appear on the storefront. Drafts and unpublished
changes stay invisible until published. The public client uses the
`published` perspective.

### Catalogue health

The Studio has focused navigation for day-to-day editing:

- **All products** — search by name or SKU.
- **Products by category** — each primary category includes products filed in
  its subcategories.
- **Products by brand** — one list per brand, plus products with no brand.
- **Recently updated products** and **Unpublished drafts** — quick review lists.
- **Prices & units** — a focused list for price checks and edits.
- **Categories by build stage** — top-level categories grouped into structure,
  finishing, services and other.
- **Catalogue health** — saved lists for common data problems:
  - Missing images
  - Price on request
  - Price not supplied
  - Fixed price missing an amount
  - Missing unit or category
  - No specifications
  - Featured products
  - Sample/demo content

Use these before launch to catch incomplete records.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page, build-stage sections, category index, featured products, brands. |
| `/categories` | Full category index grouped by build stage. |
| `/search` | Global search, filters, sorting and pagination. |
| `/category/[...slug]` | Any category at any depth, with children and breadcrumbs. |
| `/product/[slug]` | Product detail, gallery, specifications, variants and enquiry panel. |
| `/brands` | Brand index with product counts. |
| `/brands/[slug]` | Products for one brand. |
| `/enquiry` | Review the local enquiry list, print an estimate and send on WhatsApp. |
| `/quote` | Prepare a bulk quotation request in WhatsApp. |
| `/delivery` | Delivery guidance; coverage is confirmed individually, not from a pincode list. |
| `/calculator` | Material quantity estimator. |
| `/compare` | Side-by-side product comparison. |
| `/enquiry-tracker` | Browser-local follow-up list for saved enquiries. |
| `/about` | Shop story, values and visit details. |
| `/contact` | Contact actions, address, hours, service area and directions. |
| `/account`, `/sign-in`, `/sign-up` | Better Auth account pages; public sign-up is disabled by default. |
| `/admin` | Enquiry follow-up console; requires an allowlisted admin account. |
| `/studio` | Embedded Sanity Studio for products, categories, brands and Site Settings. |
| `/api/revalidate` | Sanity webhook target. |

Missing categories, products and brands return a real `404` response. The
global search page keeps a loading skeleton; the detail routes deliberately do
not have a segment-level loading boundary, because streaming before a
`notFound()` check would turn a missing record into a `200` response.

## Search and filters

Search matches product names, brands, SKUs, category names (including parent
category names), keywords/aliases and specification values. Category pages
scope the query to the category and all of its descendants. Filters include
brand, availability, price range and specification values; the available facets
are calculated from the current category and query. Specification facets appear
on category pages and once a section is selected on the global search page, so a
broad search does not scan every matching product for facets. Pagination and
sorting happen server-side.

URL parameters are stable and shareable, for example:

```text
/search?q=cement&brand=ultratech&availability=available&sort=price-asc&page=2
```

## Hindi-first bilingual copy

- Hindi is the default locale; the header switch stores `mmh-locale` in a cookie.
- UI labels, validation messages, WhatsApp templates and accessibility labels
  live in `src/lib/i18n.ts`.
- Business-written copy comes from Sanity Site settings. Each field has an
  optional English variant; Hindi is used as the fallback when English has not
  been supplied.
- `src/lib/settings.ts` resolves the right field for the current locale.
- Brand names, model names, SKUs and specification values are shown as supplied
  and are not translated.
- A fluent Hindi speaker must review the full UI and the WhatsApp message before
  launch. See the Hindi copy review section below.

## Prices, images and availability

- Every product has a unit and a price status: `fixed`, `on_request` or
  `not_supplied`.
- A fixed price must be greater than zero.
- The importer rejects a price supplied with a non-fixed status, and the
  storefront shows the status rather than the amount.
- Missing images use a labelled material study rather than a stock photo.
- Availability is shown as confirmed, on request, unavailable or not confirmed.
- The optional original/list price is only rendered when the business has
  supplied it and it is genuinely higher than the current price. No discount
  percentages or urgency claims are generated.
- Demo products are labelled in the storefront and can be found in Studio under
  Catalogue health.

## WhatsApp enquiries

The enquiry list is stored in `localStorage` under
`make-my-home-enquiry-v1` while the customer is browsing. When they submit the
enquiry, customer details and line items are saved to the PostgreSQL
`enquiries` and `enquiry_items` tables before WhatsApp opens. The WhatsApp
message is still the customer's manual confirmation step: they must press Send
inside WhatsApp.

Each line item records the selected variant, quantity, SKU, unit, price status
and availability. The WhatsApp message is generated from that saved data and
includes the variant and quantity. The link opens `wa.me` with the business
number from Site settings. The number must include its country code (for India,
`91` followed by the 10-digit number); a bare local number would produce a
broken link, so the UI treats it as not configured and offers the phone number
instead. If no real number is configured, the UI explains that WhatsApp is not
set up instead of inventing one.

The enquiry page also offers a print-friendly estimate. It is an estimate, not
an order or a quotation.

## CSV import

The importer is dry-run by default. It never writes unless `--commit` is
passed, never creates a missing SKU unless `--create-missing` is passed, and
never overwrites an existing SKU unless `--update-existing` is passed.

```bash
# Validate only; writes import-report.json
npm run import:products -- \
  --file products.csv \
  --variants variants.csv

# Create new products only
npm run import:products -- \
  --file products.csv --commit --create-missing

# Update existing products only
npm run import:products -- \
  --file products.csv --commit --update-existing

# Update existing products and upload image URLs
npm run import:products -- \
  --file products.csv --commit --update-existing --upload-images
```

`--variants` is optional. If omitted, `variants.csv` in the working directory is
used automatically when it exists. Other options: `--report <path>` and
`--help`.

### Safety rules

- Categories and brands are **not** created by the importer. They must already
  exist in Sanity. The importer accepts a category path (`Cement > OPC`),
  a slug path (`cement/opc`), or a unique category name/slug.
- Duplicate SKUs or slugs within the CSV are rejected. A slug that clashes with
  a different existing product is rejected.
- Rows that reference an unknown category or brand are reported as invalid.
- An invalid variant row invalidates its product row rather than publishing a
  partial variant set.
- When a product is updated and variants are supplied, the variant array is
  **replaced**; the report warns about this. Omit `variants.csv` to leave
  existing variants untouched.
- Optional columns that are absent from the CSV preserve existing values on
  update. An explicitly empty optional cell clears that field.
- Images are only downloaded and uploaded with `--upload-images`. URLs must be
  HTTP(S) and images are limited to 20 MB.
- Every run writes a JSON report with per-row errors, warnings and the action
  taken (`create`, `update`, `skip-exists`, `skip-missing`, `invalid`). The
  process exits non-zero when any row fails.

### Product CSV columns

Header matching is case-insensitive and ignores spaces and punctuation.
Aliases are shown in brackets.

| Column | Required | Notes |
| --- | --- | --- |
| `sku` (product code, product sku, code) | Yes | Unique, up to 80 characters. |
| `name` (product name, title) | Yes | 2–160 characters. |
| `slug` | No | Generated from the name when blank. Normalised to lowercase hyphens. |
| `category` (category path, section) | Yes | Path or unique name/slug. Must exist in Sanity. |
| `brand` (brand name) | No | Matched by name or slug. Must exist in Sanity. |
| `shortDescription` (short description, summary) | No | Up to 240 characters. |
| `description` (long description, details) | No | Blank lines become paragraphs in rich text. |
| `unit` (selling unit, uom) | Yes | For example `bag`, `metre`, `kg`, `square metre`. |
| `priceStatus` (price status) | No | `fixed`, `on_request` or `not_supplied`. Inferred as `fixed` when a price is supplied and the cell is blank. |
| `price` (rate, mrp) | Conditional | Required when `priceStatus` is `fixed`; must be greater than zero. |
| `originalPrice` (list price, mrp) | No | Only for a genuine list price. |
| `availability` (stock status) | No | `available`, `on_request`, `unavailable` or `not_confirmed`. Defaults to `not_confirmed`. |
| `featured` (feature) | No | `true`/`false`; only feature approved products. |
| `keywords` (aliases, search aliases) | No | Separated by `|` or `;`. |
| `imageUrls` (images, image urls) | No | Separated by `|` or `;`, maximum 8. Requires `--upload-images`. |
| `specifications` (specs) | No | `Key: Value` pairs separated by `|` or `;`. Prefix a group with `[Group] Key: Value`. If the category has suggested specification names, missing ones are reported as warnings only. |
| `isDemo` (demo) | No | `true`/`false`. Demo products are labelled in the storefront. |

### Variant CSV columns

| Column | Required | Notes |
| --- | --- | --- |
| `productSku` (product sku, parent sku, sku) | Yes | Must match a SKU in the products CSV. |
| `variantLabel` (variant label, label, variant) | Yes | What the customer selects, up to 120 characters. |
| `variantSku` (variant sku, sku) | No | Variant-level identifier. |
| `attributes` (variant attributes) | Yes | `Name: Value` pairs separated by `|` or `;`. |
| `price` (rate) | Conditional | Required when the variant price status is `fixed`. |
| `priceStatus` (price status) | No | Inherits the product status when blank; inferred as `fixed` when a price is present. |
| `unit` (selling unit) | No | Inherits the product unit when blank. |
| `availability` (stock status) | No | Inherits the product availability when blank. |
| `imageUrl` (image) | No | Requires `--upload-images`. |

See `samples/products.csv`, `samples/variants.csv` and `samples/README.md` for a
working format example. The sample rows are placeholders marked `isDemo=true`
and are never imported automatically.

## Built-in demo mode

Demo mode is an explicit local design-review aid. It is only used when Sanity is
not configured **and** `ALLOW_DEMO_DATA=true`, and it is refused in production.
With a configured Sanity project, the storefront always reads Sanity and shows
honest empty states when content has not been published. The demo is clearly
labelled, never a silent fallback that pretends to be real:

- 10 primary categories with nested subcategories and build stages.
- 25 products across cement, aggregates, steel, stone, tiles, sanitaryware,
  lighting, hardware, electrical and plumbing.
- 16 brands.
- Only the original ten sample products carry a sample price. Every added demo
  product is “price on request” or “price not supplied”.
- Product images are intentionally absent; the UI shows an abstract material
  study instead of a fake product photo.
- Demo contact details, address and opening hours are placeholders. They must
  never be presented as the real business.
- The home page, search results, category pages and demo product cards carry a
  demo label.

Replace demo content before launch by configuring Sanity and publishing real
documents. Do not copy demo prices, contact details or specifications into the
CMS.

## Demo seed

The optional seed script creates a small, obviously labelled demo taxonomy and
three demo products. It never touches Site settings.

```bash
npm run seed:demo            # preview only
npm run seed:demo -- --commit
```

It requires `NEXT_PUBLIC_SANITY_PROJECT_ID` and, for `--commit`,
`SANITY_API_WRITE_TOKEN`. Remove demo content before launch from Studio →
Catalogue health → Sample / demo content.

## Better Auth and admin access

Better Auth stores users and sessions in PostgreSQL. Set `DATABASE_URL` and
`BETTER_AUTH_SECRET`, then apply the SQL migrations before using account or
enquiry features:

```bash
npm run db:migrate
```

Admin routes require a signed-in Better Auth user whose email is listed in
`ADMIN_EMAILS`. An empty allowlist denies admin access. Public registration is
disabled by default; set `ALLOW_PUBLIC_SIGNUP=true` only when you intend to
accept public account creation. The setting controls both the sign-up page and
the Better Auth API.

Sanity editors authenticate separately through Sanity Studio at `/studio`.

## Revalidation webhook

Sanity fetches are cached by tag (`products`, `categories`, `brands`,
`site-settings`) with short time-based revalidation. For instant updates,
create a Sanity webhook:

- URL: `https://your-domain.example/api/revalidate`
- Method: `POST`
- Secret: the same value as `SANITY_REVALIDATE_SECRET`, sent as the
  `x-revalidate-secret` header or `?secret=...` query parameter.
- Payload: the default document JSON (the route reads `_type`).

The route maps product/category/brand/settings changes to the relevant tags.
Without a configured secret it returns `503`; with a wrong secret it returns
`401`. `GET` returns `405`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Generate route types, then run `tsc --noEmit`. |
| `npm run typegen` | Regenerate Next.js route types only. |
| `npm run import:products` | Validate or import products/variants from CSV. |
| `npm run seed:demo` | Preview or create the optional demo catalogue. |
| `npm run db:migrate` | Apply PostgreSQL migrations in filename order. |
| `npm run db:generate` | Generate the Prisma Client from `prisma/schema.prisma`. |

## Project structure

```text
sanity.config.ts              Embedded Studio configuration
sanity.cli.ts                 Sanity CLI configuration
scripts/import-products.ts    CSV importer (dry-run first)
scripts/seed-demo.ts          Optional demo content
samples/                      Example CSV files and notes
src/app/(site)/               Storefront pages and chrome
src/app/studio/               Embedded Studio route
src/app/api/revalidate/       Sanity webhook handler
src/components/               Shared UI, enquiry list, filters, gallery
src/lib/                      Sanity client, GROQ queries, catalogue,
                              categories, filters, formatting, WhatsApp,
                              bilingual settings and the demo catalogue
src/lib/demo-data.ts          Labelled demo catalogue used without Sanity
src/lib/settings.ts           Hindi/English Site settings resolver
src/sanity/schemaTypes/       Content schemas and validation
src/sanity/structure.ts       Studio navigation and catalogue health
src/proxy.ts                  Request proxy with API and Studio exclusions
```

## Deployment checklist

1. Set all required environment variables in the hosting provider.
2. Add the production origin to Sanity CORS with credentials enabled for Studio.
3. Publish Site settings with the real business name, WhatsApp number, address,
   hours and service area. Add English versions for every business-written
   field so the English switch does not fall back to Hindi.
4. Create the approved category tree, build stages and brands.
5. Import or enter real products; run the importer as a dry run first and
   review `import-report.json`.
6. Replace missing images, units and prices or leave them as honest
   `on_request`/`not_supplied` states.
7. Remove all demo content and confirm no `isDemo` products remain. Replace the
   demo contact details and photography.
8. Configure the Sanity revalidation webhook and secret.
9. Run `npm run typecheck`, `npm run lint` and `npm run build`.
10. Smoke-test direct refreshes for `/`, `/categories`, `/search`, a category,
    a product, `/brands`, `/enquiry`, `/about`, `/contact`, `/studio` and a
    missing route (`404`). Check both Hindi and English.
11. Test the WhatsApp message on a real phone, including a variant and
    quantity.
12. Confirm browsing and enquiries work with `ALLOW_PUBLIC_SIGNUP=false`.

## Pre-launch usability test

Run these uncoached tasks with 3–5 representative customers on a small Android
phone and a throttled connection. Do not explain the interface or point at
buttons; note where they hesitate.

1. Find cement.
2. Find a specific brand and product (for example, a named cement bag).
3. Choose a size/variant and set a quantity.
4. Say what the price is and what unit it is sold in.
5. Send the enquiry on WhatsApp, or find the phone number to call.

Record failures as interface bugs, not user mistakes, and re-test after fixes.

## Hindi copy review

The Hindi UI uses short, everyday wording, but a fluent Hindi speaker must
review it before launch, especially:

- category and product names supplied by the business (keep them exactly as
  supplied),
- price and availability wording (`कीमत पूछें`, `दुकान से कीमत पता करें`,
  `उपलब्धता पुष्टि नहीं हुई`),
- the WhatsApp message template in `src/lib/whatsapp.ts`,
- the four journey steps on the home page.

## Troubleshooting

**The storefront says the catalogue is not configured.** Set
`NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`, then restart
the server. The site shows an honest setup state rather than crashing.

**The site is showing demo products.** Demo mode was explicitly enabled for
local review. Remove `ALLOW_DEMO_DATA=true` and configure Sanity. Demo content is
never used when Sanity is configured, and it is refused in production.

**WhatsApp buttons are missing.** Publish the Site settings document with a real
number including country code. There is no environment-variable fallback.

**Typed route errors such as `Property 'slug' does not exist on type 'unknown'`.**
Run `npm run typegen` or use `npm run typecheck`, which does it automatically.

**The Studio fails to load.** Check the project ID, dataset and CORS origins.
The Studio must be able to reach Sanity from the browser.

**Changes do not appear immediately.** Published documents are revalidated on a
short timer. Configure the webhook for instant updates, or wait for the cache
window.

**An import skipped every row.** The importer is dry-run by default. Re-run with
`--commit` plus `--create-missing` and/or `--update-existing` after reviewing the
report.

**An import cannot find a category or brand.** Create it in Studio first; the
importer only resolves existing taxonomy.

**A missing product or category returns `404` as expected, but a valid page
returns `200`.** That is correct. Detail routes check existence before
streaming so missing records get a real `404`.

## Data honesty rules

Do not invent prices, discounts, reviews, ratings, stock counts, delivery
promises, addresses or contact details. Every field shown to a customer should
come from the business or be an explicit missing-data state. The catalogue is
designed to look complete without pretending to know facts the business has not
supplied.
