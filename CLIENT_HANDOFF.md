# Make My Home — Client Handoff & Required Inputs

## Current Status

The storefront is fully built and reads its catalogue and business copy from
Sanity. The dataset currently contains no products and no Site settings
document, so the website shows honest empty states until the business publishes
real content. There is no fallback to demo products or an invented WhatsApp
number.

Demo content still exists in `src/lib/demo-data.ts` for local design review. It
is only enabled when `ALLOW_DEMO_DATA=true` and Sanity is not configured, and it
is refused in production. It must never be used as the real catalogue.

The interface is **Hindi-first** with an English switch in the header. UI labels
are bilingual in `src/lib/i18n.ts`. Business-written copy comes from the single
Sanity Site settings document and can have optional English versions.

To launch with real data, the following inputs are required from the business.
The complete Studio setup, CORS, token and webhook guide is in
[SANITY_CMS.md](./SANITY_CMS.md).

---

## 1. Sanity CMS Configuration (Required for real data)

### Environment Variables

Create `.env.local` (never commit this file):

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | `abc123xyz` | ✅ Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name | `production` | ✅ Yes |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version | `2025-01-01` | ⚠️ Optional |
| `SANITY_API_READ_TOKEN` | Read token (private dataset only) | — | ⚠️ Optional |
| `SANITY_API_WRITE_TOKEN` | Server-side Editor token for CSV imports only; not used by Studio or the live site | — | ⚠️ Only for imports |
| `SANITY_REVALIDATE_SECRET` | Shared webhook secret for immediate cache invalidation | — | ⚠️ Recommended |
| `DATABASE_URL` | Hosted PostgreSQL used by enquiries and Better Auth; Supabase transaction pooler on Vercel | — | ✅ Production |
| `DATABASE_MIGRATION_URL` | Optional direct/session URL used only for migrations | — | ⚠️ Optional |
| `BETTER_AUTH_URL` | Better Auth server base URL | Public HTTPS origin | ✅ Production |
| `BETTER_AUTH_SECRET` | Unique server-side auth secret | Generate a new production secret | ✅ Production |
| `ADMIN_EMAILS` | Comma-separated admin email allowlist | — | ✅ Production |
| `ALLOW_PUBLIC_SIGNUP` | Public registration flag | `false` | ✅ Keep disabled |
| `PAYMENTS_ENABLED` | Offer online payment on approved quotations | `true` | ⚠️ Optional |
| `YOUPI_API_URL` | YOUPI checkout portal origin | `https://pay.example.com` | ✅ When payments on |
| `YOUPI_MERCHANT_ID` | Merchant UUID from the YOUPI admin | — | ✅ When payments on |
| `YOUPI_MERCHANT_API_KEY` | Server-only merchant API key | — | ✅ When payments on |
| `YOUPI_WEBHOOK_SECRET` | Webhook signing secret | — | ✅ When payments on |
| `YOUPI_METHOD` | Payment method used for quotations | `MANUAL_UPI` | ⚠️ Keep default |

The WhatsApp number is **not** an environment variable. It is read only from
Sanity Studio → Site settings. There is no fallback; if it is missing or
invalid, WhatsApp buttons are hidden and the site shows an honest empty state.

### Studio Setup Steps

1. Create a Sanity project at https://sanity.io/manage
2. Note the Project ID and Dataset name
3. Add them to `.env.local`
4. Run `npm run dev` and open `http://localhost:3000/studio`
5. Create **Site settings** first (business name, WhatsApp number, address,
   hours, service area, tagline, price note, footer note, announcement)
6. Create categories → brands → products (in that order)
7. Publish all documents

### CORS and Webhook Configuration (for Studio)

In the Sanity dashboard, add these CORS origins:

- `http://localhost:3000` (development)
- The exact production domain (for example, the real HTTPS origin)

Enable **Allow credentials** on every origin. Wildcard origins are not
acceptable for credentialed Studio login.

Then create a POST webhook to `/api/revalidate` with the same value as
`SANITY_REVALIDATE_SECRET`. The filter and payload details are in
[SANITY_CMS.md](./SANITY_CMS.md).

These are Sanity dashboard settings. Application code cannot create or change
them; a project administrator must apply them manually.

Studio access is controlled by Sanity project members and roles. The separate
`ADMIN_EMAILS` allowlist only controls the custom `/admin` enquiry console.

---

## 2. Business Details (Required)

The WhatsApp number **must** include country code. For India, format:
`91XXXXXXXXXX` (11 digits total).

| Field | Required input | Where it appears |
|-------|----------------|------------------|
| WhatsApp number | Real number with country code (11–15 digits, no leading `00`) | Header utility bar, product pages, enquiry and quote pages, WhatsApp links |
| Phone number | Real business phone number | Header, footer, contact section, call buttons |
| Business name | Registered trading name | Header, footer, page titles, enquiry messages |
| Tagline | Approved Hindi tagline, plus optional English version | Header subtitle, metadata |
| Service area | Areas the business actually serves; do not list unconfirmed coverage | Header utility bar, footer, contact |
| Address | Full verified shop address | Footer, about, contact |
| Opening hours | Verified opening hours | Footer, about, contact |
| Email | Real monitored inbox | Footer contact |
| Price note | Approved wording about price confirmation | Product pages, enquiry, footer |

None of these values are hard-coded. They must be entered and published in
Sanity Site settings.

### English versions (recommended)

Every business-written field has an optional English version. Add English copy
for at least the tagline, service area, address, opening hours, announcement,
price note and footer note so the English switch does not fall back to Hindi.
The fields are:

- `taglineEn`
- `addressEn`
- `serviceAreaEn`
- `openingHoursEn`
- `announcementEn`
- `priceNoteEn`
- `footerNoteEn`

If an English field is left empty, the storefront automatically uses the Hindi
version.

---

## 3. Category Taxonomy (Required — Must Be Approved)

The current reference taxonomy in `src/lib/demo-data.ts` is **draft/unconfirmed**.
You must approve the final list before publishing.

### Reference (Draft) — 10 Main Sections

| # | Hindi Name | English | Example Subcategories |
|---|-----------|---------|----------------------|
| 1 | सीमेंट और कंक्रीट | Cement & concrete | OPC, PPC, white cement |
| 2 | रेत, गिट्टी और एग्रीगेट | Sand, aggregates & stone dust | River sand, aggregate, stone dust |
| 3 | सरिया और स्टील | TMT & steel | TMT bars, MS sections, binding wire |
| 4 | पत्थर और मार्बल | Stone & marble | Kota, Jaisalmer, marble, granite |
| 5 | टाइल्स और फ्लोरिंग | Tiles & flooring | Vitrified, ceramic, flooring stone |
| 6 | सैनीटरीवेयर | Sanitaryware | Wash basins, toilets, taps, showers |
| 7 | लाइटिंग | Lighting | LED bulbs, tube lights, fans |
| 8 | हार्डवेयर और औज़ार | Hardware & tools | Fasteners, hand tools, door fittings |
| 9 | तार और इलेक्ट्रिकल | Wires & electrical | Wiring, switches, sockets, MCB |
| 10 | पाइप और प्लंबिंग | Pipes & plumbing | PVC, CPVC, fittings |

Each top-level category carries a **build stage** used for homepage grouping:

- Foundation & structure
- Finishing
- Electrical & plumbing
- Other

**Action needed:** Review and confirm:

- [ ] Are these the right 10 main sections?
- [ ] Are the Hindi names correct for your region?
- [ ] What subcategories do you need under each?
- [ ] What order should they appear in?

---

## 4. Product Data (~900 Products)

The import system accepts `products.csv` + optional `variants.csv`.

### CSV Import Command (Dry Run First)

```bash
# Test without writing anything
npm run import:products -- --file products.csv --variants variants.csv

# When ready, commit with explicit flags
npm run import:products -- --file products.csv --variants variants.csv --commit --create-missing --update-existing

# To upload images too
npm run import:products -- --file products.csv --variants variants.csv --commit --create-missing --update-existing --upload-images
```

### Sample CSV Columns (products.csv)

| Column | Required | Example | Notes |
|--------|----------|---------|-------|
| sku | Yes | UT-OPC53-50KG | Unique identifier, used for duplicate detection |
| name | Yes | UltraTech OPC 53 Grade Cement | Product name (as supplied by business) |
| slug | No | ultratech-opc-53-cement | Auto-generated from name if blank |
| category | Yes | सीमेंट और कंक्रीट > OPC सीमेंट | Full path using `>` separator |
| brand | Yes | UltraTech | Must exist as a brand first |
| unit | Yes | बोरी | Selling unit (बोरी, किग्रा, मीटर, आदि) |
| priceStatus | Yes | fixed | fixed / on_request / not_supplied |
| price | Conditional | 420 | Required when priceStatus=fixed, must be >0 |
| availability | No | available | available / on_request / unavailable / not_confirmed |
| specifications | No | ग्रेड: OPC 53 \| बोरी वजन: 50 kg | Key: Value pairs, separated by `\|` |
| keywords | No | सीमेंट, अल्ट्राटेक, OPC | Search aliases, separated by `\|` |
| imageUrls | No | https://... | Up to 8 URLs, requires `--upload-images` |

### Sample CSV Columns (variants.csv)

| Column | Required | Example |
|--------|----------|---------|
| productSku | Yes | JSW-TMT-500D |
| variantLabel | Yes | 12mm × 12 meter |
| variantSku | No | JSW-TMT-12MM-12M |
| attributes | Yes | साइज़: 12mm \| लंबाई: 12 मीटर |
| price | No | 685 |
| priceStatus | No | fixed |
| unit | No | किग्रा |

**Important:** Variants in `variants.csv` **replace** the entire variants array
for that product. A warning is shown before this happens.

---

## 5. Hindi & English Copy Review (Required Before Launch)

All customer-facing UI labels live in `src/lib/i18n.ts`. Business-written copy
lives in Sanity Site settings. A fluent Hindi speaker and a fluent English
speaker must review:

| Section | Keys to Review |
|---------|---------------|
| Navigation | categories, allProducts, brands, enquiryList, menu, back |
| Homepage | homeHeroTitle, homeHeroBody, homeStepsTitle, step1Title–step4Body |
| Sections | homeSectionsTitle, homeSectionsIntro, homeFeaturedTitle |
| Search | searchLabel, searchPlaceholder, searchButton, searchHint |
| Prices | price, quantity, unit, priceOnRequest, priceNotSupplied |
| Availability | availabilityAvailable, availabilityOnRequest, availabilityUnavailable |
| WhatsApp | whatsappAsk, whatsappMessageIntro, whatsappMessageOutro |
| Enquiry | reviewEnquiry, enquiryIntro, addToList, printEstimate |
| Errors | notFoundTitle, notFoundBody, errorTitle, errorBody |
| Footer | footerCatalogue, footerContact, footerRights, footerIndicative |
| Settings | tagline, address, serviceArea, openingHours, announcement, priceNote, footerNote and their English versions |

**Action needed:** Have fluent speakers review all customer-facing strings and
report any changes needed. Brand names, model names, SKUs and specification
values are not translated and must be checked exactly as supplied.

---

## 6. Photography and artwork (Required before launch)

- Replace the placeholder photographs in `public/images/`.
- Replace the abstract material studies in `public/material/` only if the client
  has product or category photography. Otherwise keep them as labelled studies.
- Do not present any stock or decorative image as the actual product.
- Add category images in Sanity where the business has approved artwork.
- Add product images (up to 8 per product) through the importer or Studio.

---

## 7. Better Auth

Better Auth protects administrator pages and enquiry management. Admin access is
restricted to the addresses in `ADMIN_EMAILS`; an empty allowlist denies access.
Public sign-up is disabled by default and must remain disabled in production.
Customer sign-in is optional for browsing the catalogue.

The production database, `BETTER_AUTH_URL`, and a unique
`BETTER_AUTH_SECRET` must be configured in the hosting provider. The first administrator
account must be provisioned through an approved secure process, then its email added to
`ADMIN_EMAILS`. Never commit auth secrets or use the local development secret
in production.

---

## 8. Online Payments (YOUPI-PG)

Online payment is available **only for an approved quotation**. There is no cart
checkout: a customer builds an enquiry list, the shop replies with an approved
amount, and only then can that amount be paid online by UPI.

### How the flow works

1. The customer sends an enquiry list from the site (WhatsApp or the enquiry form).
2. In `/admin/enquiries`, the shop sets the status to **quoted**, enters the
   approved amount and a reply, and saves. This creates a private quote link.
3. The shop sends that link to the customer. The customer opens
   `/quote/<token>`, sees the approved amount, and presses **Pay**.
4. The customer pays from their own UPI app in the YOUPI checkout and submits
   the UPI reference (UTR).
5. YOUPI sends a signed webhook. The quote page shows *"payment is being
   verified"* and the payment appears in `/admin` with its UTR.
6. The shop checks the receiving bank account and presses **Confirm money
   received**. Only then is the quotation marked paid and the enquiry converted.

A UTR, QR scan, browser redirect or signed webhook is **not** proof of
settlement. The bank account check in step 6 is the final authority, which is why
the confirmation button lives in the admin console and not in the gateway.

### Gateway setup (one-time)

1. Deploy YOUPI-PG. It is a separate service, not part of this Next.js app.
2. In the YOUPI merchant admin, create the merchant and register the receiving
   UPI account. Copy the merchant UUID and API key.
3. Set the environment variables in the table above.
4. Register `https://<storefront>/api/webhooks/youpi` as the merchant webhook.
5. Add the exact storefront origin to `YOUPI_ALLOWED_RETURN_ORIGINS` on the
   gateway. Wildcards are not supported.
6. Approve one small real quotation end to end before launch.

If the gateway is not configured, the quote page hides the Pay button and shows
the call/WhatsApp fallback instead of failing silently. Setting
`PAYMENTS_ENABLED=false` does the same deliberately.

## 9. Production Deployment

### Build

```bash
npm run typecheck
npm run lint
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

All variables from `.env.local` must be set in your production environment
(Vercel, etc.). **Never commit `.env.local`** — it contains write tokens.

---

## 10. Pre-Launch Checklist

- [ ] Sanity project configured with Project ID and Dataset
- [ ] `.env.local` created with Sanity credentials
- [ ] Site settings created in Sanity Studio (business name, WhatsApp, phone,
      address, hours, service area, tagline, price note, footer note)
- [ ] English versions published for every business-written Site settings field
- [ ] Category taxonomy approved by business
- [ ] Build stage assigned to every top-level category
- [ ] Brands created in Sanity Studio
- [ ] Products imported via CSV (dry-run first, then commit)
- [ ] Real WhatsApp number configured (with country code)
- [ ] Real phone, email, address, hours and service area configured
- [ ] Demo contact details, prices and photography replaced or removed
- [ ] No `isDemo` products remain
- [ ] Hindi copy reviewed by fluent speaker
- [ ] English copy reviewed by fluent speaker
- [ ] Usability test completed with 3–5 customers
- [ ] `npm run typecheck`, `npm run lint` and `npm run build` pass
- [ ] Production deployment tested
- [ ] WhatsApp message tested on a real phone, including a variant and quantity
- [ ] Both Hindi and English tested on a small Android phone
- [ ] YOUPI merchant created with the real receiving UPI account
- [ ] `YOUPI_API_URL`, merchant ID, API key and webhook secret set in production
- [ ] Webhook URL registered and `YOUPI_ALLOWED_RETURN_ORIGINS` set on the gateway
- [ ] One approved quotation paid end to end and confirmed in `/admin`
- [ ] Shop staff trained to check the bank account before pressing Confirm
- [ ] A rejected payment keeps the quotation open so the customer can retry

---

## Contact for Support

If you need help with any of the above, contact the development team.
