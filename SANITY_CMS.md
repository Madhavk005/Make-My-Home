# Sanity CMS setup and operating guide

Sanity Studio is the only place where the Make My Home catalogue and website
copy are edited. The custom `/admin` console handles enquiries and admin access
only; it does not edit products.

This guide covers the configuration that lives in the Sanity dashboard and in
the hosting environment. **Dashboard changes cannot be made from application
code.** Follow the checklist manually and verify each item.

---

## 1. What the Studio manages

Open `/studio` on the running site (for example
`http://localhost:3000/studio`).

| Document | Purpose |
| --- | --- |
| **Site settings** (one document) | Business name, tagline, logo, WhatsApp, phone, email, address, service area, opening hours, announcement, price note, footer note and social links. Hindi fields plus optional English versions. |
| **Category** | Nested taxonomy, slug, image, display order, build stage and optional specification template. |
| **Brand** | Brand name, slug, logo, description, website and display order. |
| **Product** | Name, unique slug, unique SKU, category, brand, short/long description, selling unit, price status/price/list price, availability, variants, specifications, up to 8 images, search keywords, featured flag and demo flag. |

Site settings is a fixed singleton with document ID `siteSettings`. Edit it
from the **Site settings** item at the top of the Studio navigation. Do not
create a second Site settings document.

Product and category slugs and product SKUs are validated as unique. Category
parenting blocks self-reference and circular chains. These checks run against
the dataset as you edit.

---

## 2. First-time Studio checklist

1. Set the Sanity project and dataset in the environment:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET` (usually `production`)
   - `NEXT_PUBLIC_SANITY_API_VERSION` (optional, defaults to `2025-01-01`)
2. In [sanity.io/manage](https://sanity.io/manage), open the project → **API** →
   **CORS origins** and add every origin that will open Studio:
   - `http://localhost:3000` for local development
   - the exact production origin, for example `https://www.example.in`
   - preview origins if Studio must run on preview deployments
3. For each origin, enable **Allow credentials**. Without it, Sanity login in
   the embedded Studio fails even though the page itself loads.
4. Do not use wildcard (`*`) origins for a credentialed Studio. Use exact
   origins with the correct scheme and port.
5. Add the people who will edit content under project **Members**. Assign a
   role that can read and write content (for example Editor). Viewers cannot
   publish.
6. Open `/studio`, sign in with a Sanity account, and create **Site settings**
   first. Publish it before testing the storefront.
7. Create categories, then brands, then products. Products require an existing
   category reference and a selling unit.
8. Publish each document. Drafts do not appear on the public website.

**Studio access is separate from `ADMIN_EMAILS`.** `ADMIN_EMAILS` only controls
the custom `/admin` console. Anyone added as a project member in Sanity can use
Studio, subject to their Sanity role. Keep the member list small and review it
regularly in the Sanity dashboard.

---

## 3. Environment variables and tokens

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Browser Studio and server reads | Public, not a secret. |
| `NEXT_PUBLIC_SANITY_DATASET` | Browser Studio and server reads | Public. Should be the published dataset. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Browser Studio and server reads | Optional. |
| `SANITY_API_READ_TOKEN` | Server reads only | Only needed when the dataset is private. Never prefix with `NEXT_PUBLIC_`. |
| `SANITY_API_WRITE_TOKEN` | Import scripts only | Server-side CLI credential for `npm run import:products -- --commit` and `npm run seed:demo -- --commit`. Not needed by the running website and not needed to edit or publish in Studio. Never prefix with `NEXT_PUBLIC_`. |
| `SANITY_REVALIDATE_SECRET` | `/api/revalidate` | Shared secret used by the webhook. Generate a long random value. |

Studio editors sign in with their own Sanity accounts. They do not use
`SANITY_API_WRITE_TOKEN`.

Production only needs the two public project values, optional read token, and
the revalidation secret. The write token belongs in a local shell or a secured
CI/import job, never in the browser bundle.

---

## 4. Publishing and cache behaviour

- The public site reads with the Sanity `published` perspective. Drafts and
  unpublished edits stay invisible until an editor presses **Publish**.
- The Sanity CDN is disabled in application code, so reads come from the
  Content Lake directly.
- Storefront queries are cached by tag: `products`, `categories`, `brands` and
  `site-settings`. Cached queries also have a time-based fallback of 30–300
  seconds depending on the page.
- Without a webhook, published changes appear after that cache window. With the
  webhook, they appear immediately.

Recommended webhook configuration in [sanity.io/manage](https://sanity.io/manage)
→ project → **API** → **Webhooks**:

| Setting | Value |
| --- | --- |
| Name | `Make My Home revalidate` |
| URL | `https://YOUR_DOMAIN/api/revalidate?secret=YOUR_SANITY_REVALIDATE_SECRET` |
| Method | `POST` |
| API version | `v2025-01-01` (or the version configured in the app) |
| Trigger on | Create, update and delete |
| Filter | `_type in ["product", "category", "brand", "siteSettings"]` |
| Projection | Leave the default payload, or `{_type}`. The route only needs `_type`. |

If you prefer a header, the route also accepts `x-revalidate-secret`. Configure
it as a custom HTTP header in the webhook and keep the secret out of the URL.
The header name is case-insensitive.

Behaviour of `/api/revalidate`:

- `503` when `SANITY_REVALIDATE_SECRET` is empty. The route never revalidates
  anonymously.
- `401` when the supplied secret does not match.
- `200` with the revalidated tags when the request is valid.
- A body with `_type` revalidates only the related tags; an unknown or empty
  body revalidates all four tags.

`GET /api/revalidate` returns `405`; only `POST` is accepted.

---

## 5. Adding the catalogue (about 900 products)

Use this order:

1. **Site settings** — one published document with the real business details.
2. **Categories** — create the real top-level and nested taxonomy. Category
   names, slugs and build stages drive navigation and filtering.
3. **Brands** — only real brands. Leave a product's brand empty when it has
   none; do not invent one.
4. **Products** — enter them in Studio, or use the CSV importer for bulk work.

For day-to-day edits, the Studio navigation includes:

- **All products** — search by name or SKU.
- **Products by category** — each top-level category includes products filed in
  its subcategories.
- **Products by brand**.
- **Recently updated products** and **Unpublished drafts**.
- **Prices & units** — quick review of price and unit fields.
- **Categories by build stage**.
- **Catalogue health** — products missing images, categories, units or
  specifications, fixed prices without an amount, on-request/not-supplied
  prices, featured products and demo-flagged products.

### Bulk import

The importer is a CLI tool, not a Studio feature. It validates every row and is
a dry run unless `--commit` is passed.

```bash
# 1. Dry run. Writes import-report.json only.
npm run import:products -- \
  --file samples/products.csv \
  --variants samples/variants.csv

# 2. Read the report, fix every error, then commit.
npm run import:products -- \
  --file products.csv \
  --variants variants.csv \
  --commit --create-missing

# 3. Deliberately update existing SKUs.
npm run import:products -- \
  --file products.csv \
  --commit --update-existing --upload-images
```

- Categories and brands must already exist in Sanity. The importer matches
  categories by path (`Cement > OPC`) and does not create taxonomy.
- Existing SKUs are never overwritten unless `--update-existing` is passed.
- New SKUs are never created unless `--create-missing` is passed.
- Images are only uploaded when `--upload-images` is passed.
- `samples/` contains format examples with `isDemo=true`. Never import those
  rows into a live catalogue.
- The importer requires `SANITY_API_WRITE_TOKEN` for `--commit`.

See the CSV import section of [README.md](./README.md) for the full column
reference.

### Editing at 900-product scale

- Use the product list search and the category/brand lists rather than
  scrolling the full catalogue.
- Use **Catalogue health** before launch to find incomplete products.
- Use **Unpublished drafts** to review work that is not live.
- Prefer the CSV importer for large initial loads and price updates; use Studio
  for individual edits, images, variants and descriptions.
- Keep one SKU per sellable item. Use variants for size/colour/pack options.

---

## 6. Verification checklist

After configuration, verify:

1. `/studio` loads and sign-in succeeds for an invited Sanity member.
2. **Site settings** publishes with the real WhatsApp number, including country
   code (11–15 digits). A 10-digit local number will not work in `wa.me` links.
3. A product can be created with category, brand, images, description, price,
   unit, availability and specifications, then published.
4. The published product appears on the storefront after refreshing the page.
   With the webhook configured, it appears without waiting for the cache window.
5. A draft edit does **not** appear on the storefront until published.
6. WhatsApp buttons open `wa.me` with the Site Settings number. When Site
   Settings has no valid number, buttons are hidden and honest empty states are
   shown instead.
7. `/quote` prepares a message and tells the customer to press **Send** inside
   WhatsApp. It does not claim the request was submitted.
8. `/delivery` does not publish a pincode list or promise coverage; it asks the
   customer to confirm with the shop.

---

## 7. Common problems

| Symptom | Likely cause |
| --- | --- |
| Studio loads but login loops or fails | CORS origin missing, wrong scheme/port, or **Allow credentials** disabled. |
| Edited product not on the website | Document is still a draft, or the webhook is missing/misconfigured. Publish and check the cache window. |
| Webhook returns `503` | `SANITY_REVALIDATE_SECRET` is empty in the running environment. |
| Webhook returns `401` | URL/header secret does not match the environment value. |
| WhatsApp button missing | No valid number in Site settings, or the number has fewer than 11 digits / no country code. |
| `SANITY_API_WRITE_TOKEN` error during import | Token missing, or it is not a server-side Editor token. Studio does not need this token. |
| Site settings cannot be found | Open the fixed **Site settings** item in Studio; do not create a new document type. |

Remember: application code cannot change Sanity CORS, members, roles, tokens or
webhooks. Those are dashboard settings owned by the Sanity project
administrator.
