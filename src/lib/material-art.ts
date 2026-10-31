/**
 * Local, abstract material illustrations used when the business has not
 * supplied a photograph. These are deliberately diagrams, not pretend photos:
 * the UI labels them as material studies so a shopper is never misled.
 */

const ART = {
  cement: "/material/cement-concrete.svg",
  sand: "/material/sand-aggregates.svg",
  steel: "/material/steel-tmt.svg",
  stone: "/material/stone-marble.svg",
  tiles: "/material/tiles-flooring.svg",
  sanitary: "/material/sanitaryware.svg",
  lighting: "/material/lighting.svg",
  hardware: "/material/hardware-tools.svg",
  wires: "/material/wires-electrical.svg",
  pipes: "/material/pipes-plumbing.svg",
  placeholder: "/material/material-placeholder.svg",
} as const;

type ArtKey = keyof typeof ART;

const RULES: Array<{ key: ArtKey; words: string[] }> = [
  { key: "cement", words: ["cement", "सीमेंट", "कंक्रीट", "opc", "ppc", "concrete"] },
  { key: "sand", words: ["sand", "रेत", "बालू", "गिट्टी", "aggregate", "रोड़ी", "dust"] },
  { key: "steel", words: ["steel", "सरिया", "स्टील", "tmt", "स्टील", "लोहा", "angle", "बाइंडिंग"] },
  { key: "stone", words: ["stone", "पत्थर", "मार्बल", "marble", "granite", "कोटा", "जैसलमेर"] },
  { key: "tiles", words: ["tile", "टाइल", "floor", "फ्लोर", "vitrified", "ceramic"] },
  { key: "sanitary", words: ["sanitary", "सैनीटरी", "बेसिन", "basin", "toilet", "टॉयलेट", "नल", "faucet", "शावर"] },
  { key: "lighting", words: ["light", "लाइट", "बल्ब", "bulb", "led", "fan", "पंखा", "tube"] },
  { key: "hardware", words: ["hardware", "हार्डवेयर", "औज़ार", "tool", "bolt", "बोल्ट", "hinge", "हिंज", "fastener"] },
  { key: "wires", words: ["wire", "तार", "electrical", "इलेक्ट्रिकल", "switch", "स्विच", "cable", "mcb"] },
  { key: "pipes", words: ["pipe", "पाइप", "plumb", "प्लंबिंग", "cpvc", "pvc", "fitting", "फिटिंग"] },
];

export function materialArt(...values: Array<string | null | undefined>): string {
  const haystack = values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  for (const rule of RULES) {
    if (rule.words.some((word) => haystack.includes(word))) return ART[rule.key];
  }
  return ART.placeholder;
}

export const materialArtMap = ART;
