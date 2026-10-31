# Make My Home — Client Handoff & Required Inputs

## Current Status

The storefront is fully built and runs in **demo mode** without any Sanity
configuration. It reads from `src/lib/demo-data.ts` so every route, component,
filter, search, variant picker, enquiry list and WhatsApp message can be
reviewed before real content exists.

Demo catalogue:

- 10 primary categories with nested subcategories and build stages.
- 25 products across cement, aggregates, steel, stone, tiles, sanitaryware,
  lighting, hardware, electrical and plumbing.
- 16 brands.
- Only the original ten sample products carry a sample price. Every added demo
  product is “price on request” or “price not supplied”.
- Product images are intentionally absent. The UI shows an abstract, labelled
  material study instead of pretending a stock photograph is the product.
- Demo contact details, address, opening hours, service area, tagline, price
  note and announcement are placeholders. They must not be treated as real.

The interface is **Hindi-first** with an English switch in the header. UI labels
are bilingual in `src/lib/i18n.ts`. Business-written copy comes from Sanity Site
settings and can have optional English versions.

To launch with real data, the following inputs are required from the business.

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
| `SANITY_API_WRITE_TOKEN` | Write token (for CSV import only) | — | ⚠️ Optional |
| `SANITY_REVALIDATE_SECRET` | Webhook secret for cache invalidation | — | ⚠️ Optional |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | — | ⚠️ Optional |
| `CLERK_SECRET_KEY` | Clerk secret key | — | ⚠️ Optional |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Fallback WhatsApp number | `919876543210` | ⚠️ Optional fallback |

### Studio Setup Steps

1. Create a Sanity project at https://sanity.io/manage
2. Note the Project ID and Dataset name
3. Add them to `.env.local`
4. Run `npm run dev` and open `http://localhost:3000/studio`
5. Create **Site settings** first (business name, WhatsApp number, address,
   hours, service area, tagline, price note, footer note, announcement)
6. Create categories → brands → products (in that order)
7. Publish all documents

### CORS Configuration (for Studio)

Add these to your Sanity project's CORS origins:

- `http://localhost:3000` (development)
- Your production domain (for example `https://makemyhome.example.in`)

Allow credentials: Yes

---

## 2. Business Details (Required)

The WhatsApp number **must** include country code. For India, format:
`91XXXXXXXXXX` (11 digits total).

| Field | Example | Where it appears |
|-------|---------|------------------|
| WhatsApp number | `919876543210` | Header utility bar, product pages, enquiry page, WhatsApp links |
| Phone number | `919876543210` | Header, footer, contact section, call buttons |
| Business name | "Make My Home" | Header, footer, page titles, enquiry messages |
| Tagline | "निर्माण सामग्री का कैटलॉग" | Header subtitle, metadata |
| Service area | "जयपुर और आसपास के इलाके" | Header utility bar, footer, contact |
| Address | "मुख्य बाजार, निर्माण नगर, जयपुर, राजस्थान" | Footer, about, contact |
| Opening hours | "सुबह 9:00 बजे से रात 8:00 बजे तक" | Footer, about, contact |
| Email | `info@makemyhome.example.in` | Footer contact |
| Price note | "दिखाई गई कीमतें indicative हैं। पक्की कीमत दुकानदार से पूछें।" | Product pages, enquiry, footer |

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

## 7. Clerk Authentication (Optional)

Customer accounts are optional. Browsing and WhatsApp enquiries work without
accounts.

| Variable | Description | Required? |
|----------|-------------|-----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Only if customer accounts needed |
| `CLERK_SECRET_KEY` | Clerk secret key | Only if customer accounts needed |

If left blank, the site runs without authentication (current default).

---

## 8. Production Deployment

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

## 9. Pre-Launch Checklist

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

---

## Contact for Support

If you need help with any of the above, contact the development team.
