# Make My Home — Usability Test Checklist

## Test Overview
- **Target:** 3–5 representative non-technical users (villagers/small-town customers)
- **Duration:** 20–30 minutes per user
- **Method:** Uncoached — observer takes notes, does not help unless user is stuck
- **Language:** Hindi (default), with English option available
- **Device:** Low-end Android phone, slow/throttled network

---

## Pre-Test Setup
- [ ] Device set to Hindi language preference
- [ ] Network throttled to simulate slow 3G/2G
- [ ] Browser cache cleared
- [ ] `mmh-locale` cookie reset to `hi`
- [ ] Sanity configured with real data (or demo data if client data not ready)
- [ ] Real WhatsApp number configured in Sanity Site settings
- [ ] Test device on same network as customer would use

---

## Task 1: Find Cement
**Goal:** Customer can navigate to cement products without typing.

**Steps user should take:**
1. [ ] Open homepage (`/`)
2. [ ] See "सीमेंट" category tile among the large category cards
3. [ ] Tap "सीमेंट" tile
4. [ ] Arrive at `/category/cement` page
5. [ ] See cement products listed with prices and units (₹/बोरी)

**What to observe:**
- [ ] Did user understand "सीमेंट" means cement?
- [ ] Did user tap the right tile without hesitation?
- [ ] Did the page load visibly (not blank) while images loaded?
- [ ] Did user see price with unit clearly?

**Pass criteria:** User reaches cement category and can see at least one product with price/unit within 30 seconds.

---

## Task 2: Find a Specific Brand/Product
**Goal:** Customer can find UltraTech OPC 53 Grade Cement.

**Steps user should take:**
1. [ ] From homepage, tap search box
2. [ ] Type "अल्ट्राटेक" or "सीमेंट" 
3. [ ] See search results with UltraTech products
4. [ ] Tap on a product to view details

**Alternative (browse path):**
1. [ ] Tap "सभी श्रेणियाँ देखें" → "सीमेंट"
2. [ ] See UltraTech listed as subcategory or product
3. [ ] Tap on UltraTech product

**What to observe:**
- [ ] Did user find the search box easily?
- [ ] Did search return relevant results?
- [ ] Did user understand product names (mix of Hindi + English brand names)?
- [ ] Did user tap into product detail page?

**Pass criteria:** User finds and opens a specific product detail page within 45 seconds.

---

## Task 3: Choose a Variant
**Goal:** Customer can select a different size variant on a product page.

**Test product:** TMT Fe 500D Steel Bar (has 12mm, 16mm, 20mm variants)

**Steps user should take:**
1. [ ] Open product detail page for TMT bar
2. [ ] See variant options (12mm, 16mm, 20mm) as selectable cards
3. [ ] Tap a different variant (e.g., 16mm)
4. [ ] See price update for the selected variant
5. [ ] See quantity selector

**What to observe:**
- [ ] Did user understand these are different sizes?
- [ ] Did user see price change when switching variants?
- [ ] Is the selected variant visually highlighted?
- [ ] Did user understand quantity selector (+/- buttons)?

**Pass criteria:** User successfully switches variant and sees price update within 20 seconds.

---

## Task 4: Understand Price and Unit
**Goal:** Customer understands what the price means per unit.

**Steps user should take:**
1. [ ] Look at product price display
2. [ ] Read unit (बोरी, किग्रा, मीटर, वर्ग फुट, पीस)
3. [ ] Read price status (fixed / कीमत पूछें / दुकान से कीमत पता करें)
4. [ ] Adjust quantity and see estimated total

**What to observe:**
- [ ] Did user understand "₹420 / बोरी" means 420 rupees per bag?
- [ ] Did user understand "कीमत पूछें" means ask the shop for price?
- [ ] Did user understand quantity changes the total?
- [ ] Did user trust the price is not fake/zero?

**Pass criteria:** User can explain what the price and unit mean in their own words.

---

## Task 5: Send WhatsApp / Find Call
**Goal:** Customer can send an enquiry on WhatsApp or find the phone number.

**Steps user should take:**
1. [ ] Add product to enquiry list ("सूची में जोड़ें")
2. [ ] Tap "WhatsApp पर पूछें"
3. [ ] WhatsApp opens with pre-filled message
4. [ ] Alternatively, tap "कॉल करें" to call

**What to observe:**
- [ ] Did user find the WhatsApp button easily?
- [ ] Did the message include product name, variant, quantity?
- [ ] Did user understand this is not an order confirmation?
- [ ] If WhatsApp number missing, did user see phone fallback?

**Pass criteria:** User successfully opens WhatsApp with pre-filled message or finds the call number.

---

## Post-Test Questions (ask in Hindi)

1. [ ] "क्या आपको सामान ढूँढने में आसानी हुई?" (Was it easy to find products?)
2. [ ] "कीमत समझ में आई?" (Did you understand the price?)
3. [ ] "WhatsApp बटन मिल गया?" (Did you find the WhatsApp button?)
4. [ ] "कुछ confuse करने वाला लगा?" (Was anything confusing?)
5. [ ] "आप दुकानदार से कैसे बात करेंगे?" (How will you talk to the shopkeeper?)

---

## Observer Notes Template

| User | Age | Location | Phone Type | Network | Task 1 (Cement) | Task 2 (Specific Product) | Task 3 (Variant) | Task 4 (Price/Unit) | Task 5 (WhatsApp/Call) | Confusion Points | Time |
|------|-----|----------|------------|---------|-----------------|--------------------------|-------------------|---------------------|----------------------|------------------|------|
| 1 | | | | | | | | | | | |
| 2 | | | | | | | | | | | |
| 3 | | | | | | | | | | | |
| 4 | | | | | | | | | | | |
| 5 | | | | | | | | | | | |

---

## Common Issues to Watch For

- [ ] User doesn't understand "सीमेंट" vs "cement" (Hindi vs English)
- [ ] User taps wrong element (button too small or too close together)
- [ ] User doesn't see price because it's below the fold
- [ ] User doesn't understand "कीमत पूछें" (price on request)
- [ ] WhatsApp opens but message is too long
- [ ] Page loads slowly on slow network
- [ ] User can't find the back button
- [ ] Language switch not visible enough

---

## Sign-Off Criteria (All must pass before launch)

- [ ] All 5 tasks completed by at least 3 of 5 users without coaching
- [ ] Average time per task under 60 seconds
- [ ] No confusion about Hindi category names
- [ ] No confusion about price/unit format
- [ ] WhatsApp message includes correct variant and quantity
- [ ] All touch targets are 44–48px
- [ ] Pages load in under 5 seconds on throttled 3G

**Tester:** ____________________ **Date:** ____________________
