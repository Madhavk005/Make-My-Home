import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const dir = "/Users/madhavkohli/Desktop";
const configs = [
  { file: "home-run-co-2026-11-22-20.csv", kind: "wires", price: "data", mrp: "data3", highlight: "data4" },
  { file: "home-run-co-2026-11-22-21.csv", kind: "mcb", price: "data", mrp: "data4", highlight: "data5" },
  { file: "home-run-co-2026-11-22-22.csv", kind: "switch", price: "data", mrp: "data3", highlight: "data4" },
  { file: "home-run-co-2026-11-23-2.csv", kind: "socket", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-3.csv", kind: "plate", price: "data", mrp: "data4", highlight: "" },
  { file: "home-run-co-2026-11-23-4.csv", kind: "wiringacc", price: "data", mrp: "data5", highlight: "data3" },
  { file: "home-run-co-2026-11-23-5.csv", kind: "cpvcpipe", price: "data", mrp: "data5", highlight: "data3" },
  { file: "home-run-co-2026-11-23-6.csv", kind: "cpvcfit", price: "data", mrp: "data3", highlight: "data2" },
  { file: "home-run-co-2026-11-23-7.csv", kind: "brass", price: "data", mrp: "data3", highlight: "data4" },
  { file: "home-run-co-2026-11-23-8.csv", kind: "panel", price: "data", mrp: "data5", highlight: "data3" },
  { file: "home-run-co-2026-11-23-9.csv", kind: "batten", price: "data", mrp: "data5", highlight: "data2" },
  { file: "home-run-co-2026-11-23-10.csv", kind: "powertool", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-11.csv", kind: "handtool", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-12.csv", kind: "blade", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-13.csv", kind: "measuring", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-14.csv", kind: "cleaning", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-15.csv", kind: "sanitary", price: "data", mrp: "data4", highlight: "data2" },
  { file: "home-run-co-2026-11-23-16.csv", kind: "pump", price: "data", mrp: "data2", highlight: "data3" },
];

const existingQuery = `*[_type=="product" && sku match "MMH-*"].name`;
const existing = new Set((await (await fetch("https://tv554ewm.api.sanity.io/v2025-01-01/data/query/production?query=" + encodeURIComponent(existingQuery))).json()).result);

const money = (s) => (s || "").replace(/[₹,\s]/g, "");
const csvEscape = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s; };

const PIC = "piece";

function route(name, kind) {
  if (kind === "wires") {
    if (/Flexible (?:Industrial )?(?:Wire|Cable)/i.test(name)) return { path: "Electrical > Wires & Cables > Flexible Cables", type: "Flexible cable", sku: "ELE", unit: "roll" };
    return { path: "Electrical > Wires & Cables > Copper Wires", type: "House wire", sku: "ELE", unit: "roll" };
  }
  if (kind === "mcb") {
    if (/RCBO/i.test(name)) return { path: "Electrical > Distribution > RCBO", type: "RCBO", sku: "ELE", unit: PIC };
    if (/RCCB/i.test(name)) return { path: "Electrical > Distribution > RCCB", type: "RCCB", sku: "ELE", unit: PIC };
    if (/MCB|Miniature circuit breaker/i.test(name)) return { path: "Electrical > Distribution > MCB", type: "MCB", sku: "ELE", unit: PIC };
    return { path: "Electrical > Distribution > Distribution Boards", type: "Distribution board", sku: "ELE", unit: PIC };
  }
  if (kind === "switch") {
    if (/Plate/i.test(name)) return { path: "Electrical > Switches & Sockets > Plates & Frames", type: "Modular plate", sku: "ELE", unit: PIC };
    if (/Ding Dong|Door ?Bell/i.test(name)) return { path: "Electrical > Switches & Sockets > Door Bells", type: "Door bell", sku: "ELE", unit: PIC };
    if (/Fan Regulator/i.test(name)) return { path: "Electrical > Switches & Sockets > Fan Regulators", type: "Fan regulator", sku: "ELE", unit: PIC };
    return { path: "Electrical > Switches & Sockets > Modular Switches", type: "Modular switch", sku: "ELE", unit: PIC };
  }
  if (kind === "socket") {
    if (/Smart Plug/i.test(name)) return { path: "Electrical > Switches & Sockets > Smart Switches", type: "Smart plug", sku: "ELE", unit: PIC };
    if (/Holder|Chakka|Mounting Plate/i.test(name)) return { path: "Electrical > Electrical Accessories > Holders & Ceiling Roses", type: "Batten holder / ceiling rose", sku: "ELE", unit: PIC };
    if (/Enclosure/i.test(name)) return { path: "Electrical > Electrical Accessories > Enclosures & Boxes", type: "Plug & socket enclosure", sku: "ELE", unit: PIC };
    return { path: "Electrical > Switches & Sockets > Power Sockets", type: "Modular socket", sku: "ELE", unit: PIC };
  }
  if (kind === "plate") {
    if (/Chakka/i.test(name)) return { path: "Electrical > Electrical Accessories > Holders & Ceiling Roses", type: "Ceiling rose / mounting plate", sku: "ELE", unit: PIC };
    return { path: "Electrical > Switches & Sockets > Plates & Frames", type: "Modular plate", sku: "ELE", unit: PIC };
  }
  if (kind === "wiringacc") {
    if (/Tester|Voltage Detector/i.test(name)) return { path: "Electrical > Electrical Accessories > Testers & Detectors", type: "Tester / detector", sku: "ELE", unit: PIC };
    if (/Tape/i.test(name)) return { path: "Electrical > Electrical Accessories > Electrical Tape", type: "Insulation tape", sku: "ELE", unit: /Bopp/i.test(name) ? "roll" : PIC };
    if (/Cable Tie|Nail-Clips|Spring|GI Metal Wire/i.test(name)) return { path: "Electrical > Electrical Accessories > Cable Ties, Clips & Wire", type: "Cable fixing accessory", sku: "ELE", unit: /Pack|100 Nos/i.test(name) ? "pack" : PIC };
    if (/Cutter/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Pliers & Cutters", type: "Cable cutter", sku: "TLS", unit: PIC };
    return { path: "Tools & Hardware > Hand Tools > Pliers & Cutters", type: "Plier / nipper", sku: "TLS", unit: PIC };
  }
  if (kind === "cpvcpipe") {
    if (/Solvent Cement/i.test(name)) return { path: "Plumbing > Fittings > Solvent Cement", type: "CPVC solvent cement", sku: "PLB", unit: PIC };
    if (/Clamp|Strap/i.test(name)) return { path: "Plumbing > Fittings > Pipe Clamps", type: "Pipe clamp", sku: "PLB", unit: PIC };
    if (/M-Seal/i.test(name)) return { path: "Construction > Other Construction Materials > Sealants & Applicators", type: "Sealant", sku: "CON", unit: PIC };
    return { path: "Plumbing > Pipes > CPVC Pipes", type: "CPVC pipe", sku: "PLB", unit: PIC };
  }
  if (kind === "cpvcfit") {
    if (/Ball Valve/i.test(name)) return { path: "Plumbing > Valves & Taps > Ball Valves", type: "CPVC ball valve", sku: "PLB", unit: PIC };
    if (/Elbow|Bend/i.test(name)) return { path: "Plumbing > Fittings > Elbows", type: "CPVC elbow / bend", sku: "PLB", unit: PIC };
    if (/Tee|Cross/i.test(name)) return { path: "Plumbing > Fittings > Tees", type: "CPVC tee", sku: "PLB", unit: PIC };
    if (/Union/i.test(name)) return { path: "Plumbing > Fittings > Unions", type: "CPVC union", sku: "PLB", unit: PIC };
    if (/Coupler/i.test(name)) return { path: "Plumbing > Fittings > Couplers", type: "CPVC coupler", sku: "PLB", unit: PIC };
    if (/End Cap|End Plug/i.test(name)) return { path: "Plumbing > Fittings > End Caps & Plugs", type: "CPVC end cap / plug", sku: "PLB", unit: PIC };
    if (/Nipple/i.test(name)) return { path: "Plumbing > Fittings > Nipples", type: "CPVC tank nipple", sku: "PLB", unit: PIC };
    return { path: "Plumbing > Fittings > Adapters", type: "CPVC adapter", sku: "PLB", unit: PIC };
  }
  if (kind === "brass") return { path: "Plumbing > Fittings > Brass Fittings", type: "CPVC brass fitting", sku: "PLB", unit: PIC };
  if (kind === "panel") {
    if (/Cabinet Light/i.test(name)) return { path: "Lighting > Indoor Lighting > Cabinet Lights", type: "Cabinet light", sku: "LGT", unit: PIC };
    if (/Downlight/i.test(name)) return { path: "Lighting > Indoor Lighting > Downlights", type: "LED downlight", sku: "LGT", unit: PIC };
    return { path: "Lighting > Indoor Lighting > Panel Lights", type: "LED panel light", sku: "LGT", unit: PIC };
  }
  if (kind === "batten") return { path: "Lighting > LED Lighting > LED Battens", type: "LED batten", sku: "LGT", unit: PIC };
  if (kind === "powertool") {
    if (/Angle Grinder/i.test(name)) return { path: "Tools & Hardware > Power Tools > Angle Grinders", type: "Angle grinder", sku: "TLS", unit: PIC };
    if (/Rotary Hammer/i.test(name)) return { path: "Tools & Hardware > Power Tools > Rotary Hammers", type: "Rotary hammer", sku: "TLS", unit: PIC };
    if (/Marble Cutt/i.test(name)) return { path: "Tools & Hardware > Power Tools > Marble & Tile Cutters", type: "Marble cutter", sku: "TLS", unit: PIC };
    if (/Impact Wrench/i.test(name)) return { path: "Tools & Hardware > Power Tools > Impact Wrenches", type: "Impact wrench", sku: "TLS", unit: PIC };
    return { path: "Tools & Hardware > Power Tools > Drills & Drivers", type: "Drill / driver", sku: "TLS", unit: PIC };
  }
  if (kind === "handtool") {
    if (/Tool Kit/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Clamps & Tool Kits", type: "Hand tool kit", sku: "TLS", unit: "set" };
    if (/C-Clamp/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Clamps & Tool Kits", type: "C-clamp", sku: "TLS", unit: PIC };
    if (/Plier|Nipper|Cable Cutter/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Pliers & Cutters", type: "Plier / cutter", sku: "TLS", unit: PIC };
    if (/Knife/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Knives", type: "Knife", sku: "TLS", unit: PIC };
    if (/Pipe Cutter/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Pliers & Cutters", type: "Pipe cutter", sku: "TLS", unit: PIC };
    if (/Hacksaw Blade/i.test(name)) return { path: "Tools & Hardware > Blades & Accessories > Hacksaw Blades", type: "Hacksaw blade", sku: "TLS", unit: PIC };
    if (/Screwdriver/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Screwdrivers & Spanners", type: "Screwdriver", sku: "TLS", unit: /Set/i.test(name) ? "set" : PIC };
    if (/Spanner|Wrench/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Screwdrivers & Spanners", type: "Spanner / wrench", sku: "TLS", unit: /Set/i.test(name) ? "set" : PIC };
    if (/Hammer/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Hammers", type: "Hammer", sku: "TLS", unit: PIC };
    if (/File Set|File/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Saws & Files", type: "File set", sku: "TLS", unit: /Set/i.test(name) ? "set" : PIC };
    return { path: "Tools & Hardware > Hand Tools > Saws & Files", type: "Saw / file", sku: "TLS", unit: PIC };
  }
  if (kind === "blade") {
    if (/Hacksaw Blade/i.test(name)) return { path: "Tools & Hardware > Blades & Accessories > Hacksaw Blades", type: "Hacksaw blade", sku: "TLS", unit: PIC };
    if (/Knife/i.test(name)) return { path: "Tools & Hardware > Hand Tools > Knives", type: "Snap-off knife", sku: "TLS", unit: PIC };
    return { path: "Tools & Hardware > Blades & Accessories > Cutting Blades", type: "Diamond cutting blade", sku: "TLS", unit: PIC };
  }
  if (kind === "measuring") {
    if (/Spirit Level/i.test(name)) return { path: "Tools & Hardware > Measuring Tools > Spirit Levels", type: "Spirit level", sku: "TLS", unit: PIC };
    if (/Laser|Distance Meter/i.test(name)) return { path: "Tools & Hardware > Measuring Tools > Laser Levels & Meters", type: "Laser level / meter", sku: "TLS", unit: PIC };
    return { path: "Tools & Hardware > Measuring Tools > Measuring Tapes", type: "Measuring tape", sku: "TLS", unit: PIC };
  }
  if (kind === "cleaning") {
    if (/Toilet Bowl|Bathroom Cleaner/i.test(name)) return { path: "Cleaning & Housekeeping > Housekeeping Chemicals > Bathroom & Toilet Care", type: "Bathroom / toilet cleaner", sku: "CLN", unit: "bottle" };
    if (/Air Freshener|Deodoriser/i.test(name)) return { path: "Cleaning & Housekeeping > Housekeeping Chemicals > Air Fresheners", type: "Air freshener", sku: "CLN", unit: "bottle" };
    if (/Furniture Polish/i.test(name)) return { path: "Cleaning & Housekeeping > Housekeeping Chemicals > Furniture Care", type: "Furniture polish", sku: "CLN", unit: "bottle" };
    return { path: "Cleaning & Housekeeping > Housekeeping Chemicals > Surface & Glass Cleaners", type: "Surface / glass cleaner", sku: "CLN", unit: "bottle" };
  }
  if (kind === "sanitary") {
    if (/Basin Mixer|Pillar Cock|Faucet/i.test(name)) return { path: "Sanitary > Bathroom Fittings > Faucets", type: "Basin faucet", sku: "SAN", unit: PIC };
    if (/Bottle Trap/i.test(name)) return { path: "Sanitary > Bathroom Fittings > Bottle Traps & Wastes", type: "Bottle trap", sku: "SAN", unit: PIC };
    return { path: "Sanitary > Wash Basins > Countertop Basins", type: "Table top wash basin", sku: "SAN", unit: PIC };
  }
  if (kind === "pump") return { path: "Plumbing > Pumps > Pressure Booster Pumps", type: "Pressure booster pump", sku: "PLB", unit: PIC };
  throw new Error("unknown kind " + kind);
}

function brandOf(name) {
  const checks = [
    ["Schneider Electric", "Schneider Electric"], ["Schneider", "Schneider Electric"], ["Legrand", "Legrand"],
    ["Anchor", "Anchor"], ["Polycab", "Polycab"], ["Finolex", "Finolex"], ["KEI", "KEI"], ["Havells", "Havells"],
    ["Wipro", "Wipro"], ["Philips", "Philips"], ["Sturlite", "Sturlite"], ["Jaquar", "Jaquar"],
    ["Parryware", "Parryware"], ["CERA", "CERA"], ["Cera ", "CERA"], ["Essco", "Essco"], ["V-Guard", "V-Guard"],
    ["Grundfos", "Grundfos"], ["Ashirvad", "Ashirvad"], ["Taparia", "Taparia"], ["Bosch", "Bosch"], ["Makita", "Makita"],
    ["Dongcheng", "Dongcheng"], ["Powerbilt", "Powerbilt"], ["Jon Bhandari", "Jon Bhandari"], ["Trim Cut", "Trim Cut"],
    ["Freemans", "Freemans"], ["Diversey", "Diversey"], ["Allset", "Allset"], ["Pidilite", "Pidilite"],
    ["Hi-Fi", "Hi-Fi"], ["GM ", "GM"],
  ];
  for (const [needle, brand] of checks) if (name === needle || name.startsWith(needle)) return brand;
  for (const [needle, brand] of checks) if (name.includes(needle)) return brand;
  return "";
}

function specsOf(name, rec, cfg) {
  const specs = [];
  const pack = name.match(/(\d+(?:\.\d+)?)\s*(kg|Kg|L|ml|gm|g)\b/i);
  if (pack) specs.push(`Pack size: ${pack[1]} ${pack[2]}`);
  const len = name.match(/(\d+(?:\.\d+)?)\s*(?:m|meter|metre|ft)\b/i);
  if (cfg.kind === "wires" && /(?:90|180|100)\s*m\b/i.test(name)) {
    const m = name.match(/(\d+)\s*m\b/i);
    if (m) specs.push(`Length: ${m[1]} m`);
  }
  if (rec.highlight) specs.push(`Highlight: ${rec.highlight}`);
  if (cfg.kind === "sanitary" && rec.bulk) {
    if (rec.bulk2) specs.push(`Bulk price (2+): ${rec.bulk2}/unit`);
    if (rec.bulk3) specs.push(`Bulk price (3+): ${rec.bulk3}/unit`);
  }
  return specs;
}

const headers = ["sku", "name", "slug", "category", "brand", "shortDescription", "description", "unit", "priceStatus", "price", "originalPrice", "availability", "featured", "keywords", "imageUrls", "specifications", "isDemo"];
const out = [headers.join(",")];
const seen = new Set();
const usedSkus = new Map();
let skipped = 0;
const skippedNames = [];

for (const cfg of configs) {
  const rows = parse(readFileSync(`${dir}/${cfg.file}`, "utf8"), { columns: true, skip_empty_lines: true, trim: true, bom: true });
  for (const r of rows) {
    const name = (r.name || "").replace(/\s*\|\s*/g, ", ").replace(/\s{2,}/g, " ").trim();
    if (existing.has(r.name.trim()) || seen.has(name)) { skipped += 1; skippedNames.push(name); continue; }
    seen.add(name);
    const price = Math.round(Number(money(r[cfg.price])));
    const mrpRaw = cfg.mrp ? r[cfg.mrp] : "";
    const mrp = mrpRaw && /₹/.test(mrpRaw) ? Math.round(Number(money(mrpRaw))) : null;
    const highlight = (cfg.highlight ? r[cfg.highlight] : "").trim();
    const bulkRaw = cfg.kind === "sanitary" ? (r.data5 || "") : "";
    const bulk2 = cfg.kind === "sanitary" ? (r.brand || "").replace(/[^0-9.]/g, "") : "";
    const bulk3 = cfg.kind === "sanitary" ? (r.data13 || "").replace(/[^0-9.]/g, "") : "";
    const { path, type, sku: prefix, unit } = route(name, cfg.kind);
    const specs = specsOf(name, { highlight, bulk: bulkRaw, bulk2, bulk3 }, cfg);
    const base = name
      .replace(/^(Asian Paints|Birla White|Schneider Electric|Anchor Panasonic|Anchor|Polycab|Finolex|KEI|Havells|Legrand|Wipro|Philips|Sturlite|Jaquar|Parryware|CERA|Cera|Essco|V-Guard|Grundfos|Ashirvad|Taparia|Bosch Professional|Bosch|Makita|Dongcheng|Powerbilt|Jon Bhandari|Trim Cut|Freemans|Diversey TASKI|Diversey|Allset|Pidilite)\s+/i, "")
      .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toUpperCase().slice(0, 71);
    let sku = `MMH-${prefix}-${base}`;
    const count = (usedSkus.get(sku) || 0) + 1;
    usedSkus.set(sku, count);
    if (count > 1) sku = `${sku}-${count}`;
    const slug = name.toLowerCase().replace(/,/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const packSize = specs.find((s) => s.startsWith("Pack size"))?.split(": ")[1] || "";
    const short = `${type}${packSize ? `, ${packSize}` : ""}.${highlight ? ` ${highlight}.` : ""}`;
    const desc = `${name}.${highlight ? ` ${highlight}.` : ""} Confirm the current rate and stock with the shop before ordering.`;
    const brand = brandOf(name);
    const keywords = [brand.toLowerCase(), type.toLowerCase(), packSize].filter(Boolean).join("|");
    const images = [r.image, r.image2, r.image3, r.image4, r.image5].filter(Boolean).join("|");
    const row = [sku, name, slug, path, brand, short, desc, unit, "fixed", price, mrp && mrp > price ? mrp : "", "available", "false", keywords, images, specs.join("|"), "false"];
    out.push(row.map(csvEscape).join(","));
  }
}

writeFileSync("batch4-products.csv", out.join("\n") + "\n");
console.log("to import:", out.length - 1, "skipped existing/duplicate:", skipped);
for (const n of skippedNames) console.log("  skipped:", n);
