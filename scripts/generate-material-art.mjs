/**
 * Generates the local material illustrations used when a Sanity image is not
 * available. These are intentionally abstract, editorial material studies —
 * never photographs pretending to be a real product.
 *
 * Run: node scripts/generate-material-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "material");
mkdirSync(outDir, { recursive: true });

const W = 800;
const H = 1000;

const noise = `
  <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="g"/>
    <feComponentTransfer in="g" result="a"><feFuncA type="linear" slope="0.16"/></feComponentTransfer>
    <feBlend in="SourceGraphic" in2="a" mode="multiply"/>
  </filter>`;

function frame(inner, { bg1, bg2, ink = "#1e3a2f" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <pattern id="rule" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${ink}" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
    ${noise}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#rule)"/>
  <g filter="url(#grain)">
    ${inner}
  </g>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${ink}" stroke-opacity="0.13"/>
</svg>`;
}

const art = {};

art["cement-concrete"] = frame(
  `
  <g>
    <rect x="90" y="170" width="620" height="660" fill="#d9d2c5"/>
    <rect x="90" y="170" width="620" height="210" fill="#c7bfb0"/>
    <rect x="90" y="170" width="620" height="660" fill="none" stroke="#8d867a" stroke-width="2"/>
    <circle cx="520" cy="610" r="205" fill="#eee8dd" opacity="0.9"/>
    <circle cx="520" cy="610" r="130" fill="#d5ccbd"/>
    <circle cx="520" cy="610" r="55" fill="#b9af9f"/>
    <path d="M90 780h620" stroke="#8d867a" stroke-width="2"/>
    <path d="M210 170v660M610 170v660" stroke="#8d867a" stroke-opacity="0.35"/>
    <g fill="#6f685e">
      <circle cx="190" cy="470" r="7"/><circle cx="232" cy="520" r="4"/><circle cx="170" cy="560" r="5"/>
      <circle cx="256" cy="470" r="3"/><circle cx="205" cy="610" r="6"/><circle cx="160" cy="660" r="3"/>
    </g>
    <path d="M400 830c60-35 160-35 230 0" fill="none" stroke="#a59b8b" stroke-width="3" stroke-linecap="round"/>
  </g>`,
  { bg1: "#f2ede3", bg2: "#e3dbcd" },
);

art["sand-aggregates"] = frame(
  `
  <g>
    <path d="M0 700c150-95 260 30 410-45 150-76 260-12 390-70v415H0Z" fill="#c9a25e"/>
    <path d="M0 770c170-80 270 40 430-25 140-57 240-8 370-55v310H0Z" fill="#b78843"/>
    <path d="M0 850c180-60 300 30 450-20 120-42 230 0 350-30v200H0Z" fill="#9c6c32"/>
    <g fill="#7c5427" opacity="0.75">
      <circle cx="120" cy="720" r="5"/><circle cx="180" cy="760" r="8"/><circle cx="260" cy="720" r="4"/>
      <circle cx="340" cy="780" r="6"/><circle cx="430" cy="730" r="3"/><circle cx="520" cy="790" r="7"/>
      <circle cx="610" cy="730" r="4"/><circle cx="690" cy="780" r="5"/>
      <circle cx="90" cy="820" r="4"/><circle cx="220" cy="850" r="7"/><circle cx="380" cy="840" r="3"/>
      <circle cx="540" cy="860" r="6"/><circle cx="660" cy="840" r="4"/>
    </g>
    <g fill="#efe3cb" opacity="0.75">
      <circle cx="150" cy="700" r="3"/><circle cx="300" cy="755" r="4"/><circle cx="470" cy="705" r="3"/>
      <circle cx="580" cy="755" r="5"/><circle cx="700" cy="720" r="3"/>
    </g>
    <path d="M70 200h300M70 240h190" stroke="#7c5427" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
    <circle cx="640" cy="230" r="74" fill="none" stroke="#7c5427" stroke-width="2" opacity="0.5"/>
    <circle cx="640" cy="230" r="40" fill="#efe3cb" opacity="0.6"/>
  </g>`,
  { bg1: "#f3e8d2", bg2: "#e6d2ac", ink: "#6b4a21" },
);

art["steel-tmt"] = frame(
  `
  <g transform="rotate(-24 400 500)">
    <g fill="#8f8a80">
      <rect x="120" y="120" width="46" height="760" rx="8"/>
      <rect x="212" y="120" width="46" height="760" rx="8"/>
      <rect x="304" y="120" width="46" height="760" rx="8"/>
      <rect x="396" y="120" width="46" height="760" rx="8"/>
      <rect x="488" y="120" width="46" height="760" rx="8"/>
      <rect x="580" y="120" width="46" height="760" rx="8"/>
    </g>
    <g stroke="#5d5952" stroke-width="3" opacity="0.8">
      ${Array.from({ length: 24 }, (_, i) => `<path d="M120 ${150 + i * 30}l46 14M212 ${150 + i * 30}l46 14M304 ${150 + i * 30}l46 14M396 ${150 + i * 30}l46 14M488 ${150 + i * 30}l46 14M580 ${150 + i * 30}l46 14"/>`).join("")}
    </g>
    <g stroke="#c7a25e" stroke-width="2" opacity="0.55">
      <path d="M120 120h46M212 120h46M304 120h46M396 120h46M488 120h46M580 120h46"/>
    </g>
  </g>
  <path d="M0 900h800" stroke="#c7a25e" stroke-opacity="0.25"/>`,
  { bg1: "#2d3932", bg2: "#17251d", ink: "#f1eadc" },
);

art["stone-marble"] = frame(
  `
  <g>
    <rect x="70" y="90" width="660" height="820" fill="#e7ddcb"/>
    <g fill="none" stroke-linecap="round">
      <path d="M70 260c140-40 120 120 260 80s150-170 280-90 90 210 120 170" stroke="#b9a98d" stroke-width="5" opacity="0.7"/>
      <path d="M70 340c160-30 140 140 300 90s140-150 260-70 100 190 100 190" stroke="#c9b99e" stroke-width="2.5" opacity="0.8"/>
      <path d="M70 700c120-70 160 40 280 0s170-120 300-60 110 160 80 210" stroke="#a89474" stroke-width="4" opacity="0.45"/>
      <path d="M180 90c-30 160 80 200 40 330s-80 190 0 340 60 150 60 150" stroke="#cbbda5" stroke-width="2" opacity="0.7"/>
      <path d="M620 90c-20 180 60 200 20 340s-90 210-30 340 40 140 40 140" stroke="#b7a58a" stroke-width="3" opacity="0.5"/>
    </g>
    <rect x="70" y="90" width="660" height="820" fill="none" stroke="#8f7e61" stroke-width="2"/>
    <path d="M70 910h660" stroke="#8f7e61" stroke-width="2"/>
  </g>`,
  { bg1: "#f4ede0", bg2: "#e5d9c4", ink: "#6b5b40" },
);

art["tiles-flooring"] = frame(
  `
  <g>
    <rect x="60" y="120" width="680" height="760" fill="#eadfcd"/>
    <g>
      <rect x="80" y="140" width="200" height="200" fill="#c86f45"/>
      <rect x="300" y="140" width="200" height="200" fill="#b4552d"/>
      <rect x="520" y="140" width="200" height="200" fill="#d8926b"/>
      <rect x="80" y="360" width="200" height="200" fill="#d9c8ae"/>
      <rect x="300" y="360" width="200" height="200" fill="#efe4d3"/>
      <rect x="520" y="360" width="200" height="200" fill="#c9b493"/>
      <rect x="80" y="580" width="200" height="200" fill="#a94f2b"/>
      <rect x="300" y="580" width="200" height="200" fill="#c86f45"/>
      <rect x="520" y="580" width="200" height="200" fill="#e2b291"/>
    </g>
    <g stroke="#8a5a3d" stroke-width="2" opacity="0.5">
      <path d="M80 140h640v640H80z"/>
      <path d="M280 140v640M500 140v640M80 340h640M80 560h640"/>
    </g>
    <g fill="#f6ede0" opacity="0.8">
      <circle cx="180" cy="240" r="4"/><circle cx="400" cy="240" r="4"/><circle cx="620" cy="240" r="4"/>
      <circle cx="180" cy="460" r="4"/><circle cx="400" cy="460" r="4"/><circle cx="620" cy="460" r="4"/>
      <circle cx="180" cy="680" r="4"/><circle cx="400" cy="680" r="4"/><circle cx="620" cy="680" r="4"/>
    </g>
  </g>`,
  { bg1: "#f5eee2", bg2: "#e8dbc7", ink: "#6b3a24" },
);

art["wires-electrical"] = frame(
  `
  <g fill="none" stroke-linecap="round">
    <path d="M-40 700c180-260 330-260 470-90s250 180 410-20" stroke="#c2703f" stroke-width="26"/>
    <path d="M-40 760c180-260 330-260 470-90s250 180 410-20" stroke="#b4552d" stroke-width="26"/>
    <path d="M-40 820c180-260 330-260 470-90s250 180 410-20" stroke="#d9b26e" stroke-width="26"/>
    <path d="M-40 880c180-260 330-260 470-90s250 180 410-20" stroke="#7e8f82" stroke-width="26"/>
    <path d="M-40 700c180-260 330-260 470-90s250 180 410-20" stroke="#f4eadc" stroke-width="3" opacity="0.35"/>
    <path d="M-40 760c180-260 330-260 470-90s250 180 410-20" stroke="#f4eadc" stroke-width="3" opacity="0.35"/>
  </g>
  <circle cx="400" cy="310" r="160" fill="none" stroke="#c2703f" stroke-width="2" opacity="0.5"/>
  <circle cx="400" cy="310" r="120" fill="none" stroke="#c2703f" stroke-width="1.5" opacity="0.35"/>
  <path d="M400 190v240M280 310h240" stroke="#c2703f" stroke-width="2" opacity="0.5"/>
  <rect x="330" y="240" width="140" height="140" rx="10" fill="#17251d" stroke="#c2703f" stroke-width="2"/>
  <path d="M365 310h70M400 275v70" stroke="#f4eadc" stroke-width="5" stroke-linecap="round"/>`,
  { bg1: "#203a2e", bg2: "#12241b", ink: "#f4eadc" },
);

art["pipes-plumbing"] = frame(
  `
  <g>
    <path d="M110 250h260v260h300v300" fill="none" stroke="#e8e2d5" stroke-width="104" stroke-linejoin="round"/>
    <path d="M110 250h260v260h300v300" fill="none" stroke="#b9b2a3" stroke-width="104" stroke-linejoin="round" opacity="0.25"/>
    <path d="M110 250h260v260h300v300" fill="none" stroke="#fbf7ee" stroke-width="78" stroke-linejoin="round"/>
    <g fill="#5f7c8a">
      <rect x="300" y="205" width="52" height="90" rx="6"/>
      <rect x="560" y="450" width="52" height="90" rx="6"/>
    </g>
    <g fill="none" stroke="#9a9488" stroke-width="2" opacity="0.55">
      <path d="M110 210h300v300h300v300"/>
      <path d="M110 290h220v260h340v260"/>
    </g>
    <circle cx="650" cy="250" r="84" fill="none" stroke="#5f7c8a" stroke-width="26"/>
    <circle cx="650" cy="250" r="52" fill="#fbf7ee" stroke="#9a9488" stroke-width="2"/>
    <circle cx="650" cy="250" r="22" fill="#5f7c8a" opacity="0.55"/>
  </g>`,
  { bg1: "#eef0ec", bg2: "#d9e0da", ink: "#31473c" },
);

art["sanitaryware"] = frame(
  `
  <g>
    <path d="M190 470c0-70 55-120 130-120h180c75 0 130 50 130 120v90c0 150-100 250-220 250s-220-100-220-250z" fill="#fbf8f0" stroke="#b8afa0" stroke-width="2"/>
    <path d="M190 470h420" stroke="#b8afa0" stroke-width="2"/>
    <ellipse cx="400" cy="480" rx="150" ry="52" fill="#d9d2c4" opacity="0.55"/>
    <path d="M360 350v-80c0-40 30-70 70-70h120" fill="none" stroke="#8f887c" stroke-width="14" stroke-linecap="round"/>
    <path d="M550 200v60" stroke="#8f887c" stroke-width="14" stroke-linecap="round"/>
    <path d="M520 260h60" stroke="#8f887c" stroke-width="10" stroke-linecap="round"/>
    <path d="M250 780c40 60 100 90 150 90s110-30 150-90" fill="none" stroke="#b8afa0" stroke-width="2" opacity="0.6"/>
    <circle cx="400" cy="500" r="6" fill="#8f887c"/>
    <path d="M70 880h660" stroke="#b8afa0" stroke-width="2" opacity="0.6"/>
  </g>`,
  { bg1: "#f5f0e5", bg2: "#e5ddce", ink: "#5d5a51" },
);

art["lighting"] = frame(
  `
  <g>
    <circle cx="400" cy="440" r="230" fill="#c9a25e" opacity="0.16"/>
    <circle cx="400" cy="440" r="160" fill="#c9a25e" opacity="0.2"/>
    <path d="M400 0v250" stroke="#c9a25e" stroke-width="3"/>
    <path d="M310 250h180l-32 150H342z" fill="#c9a25e"/>
    <path d="M310 250h180" stroke="#f4eadc" stroke-width="3"/>
    <circle cx="400" cy="470" r="46" fill="#f6e8c6"/>
    <circle cx="400" cy="470" r="24" fill="#fff8e6"/>
    <path d="M130 0v180" stroke="#c9a25e" stroke-width="2" opacity="0.6"/>
    <path d="M90 180h80l-14 70h-52z" fill="#c9a25e" opacity="0.65"/>
    <path d="M670 0v140" stroke="#c9a25e" stroke-width="2" opacity="0.6"/>
    <path d="M630 140h80l-14 70h-52z" fill="#c9a25e" opacity="0.65"/>
    <path d="M0 810h800" stroke="#c9a25e" stroke-opacity="0.3"/>
    <path d="M120 880h560" stroke="#c9a25e" stroke-opacity="0.18"/>
  </g>`,
  { bg1: "#1c342a", bg2: "#0f2019", ink: "#f4eadc" },
);

art["hardware-tools"] = frame(
  `
  <g>
    <g fill="none" stroke="#6f685e" stroke-width="3">
      <circle cx="270" cy="330" r="110"/>
      <circle cx="270" cy="330" r="66"/>
      <path d="M270 220v-60M270 440v60M160 330h-60M380 330h60M192 252l-42-42M348 408l42 42M348 252l42-42M192 408l-42 42"/>
      <circle cx="560" cy="260" r="76"/>
      <circle cx="560" cy="260" r="40"/>
      <path d="M560 184v-44M560 336v44M484 260h-44M636 260h44M506 206l-30-30M614 314l30 30M614 206l30-30M506 314l-30 30"/>
    </g>
    <g transform="rotate(18 400 700)">
      <rect x="330" y="530" width="140" height="330" rx="12" fill="#8f887c"/>
      <path d="M330 560h140M330 830h140" stroke="#5d5952" stroke-width="4"/>
      <path d="M360 530l40-90 40 90" fill="#b4552d"/>
      <circle cx="400" cy="620" r="26" fill="#17251d"/>
    </g>
    <g fill="#b4552d">
      <circle cx="170" cy="760" r="18"/><circle cx="640" cy="700" r="14"/><circle cx="690" cy="820" r="20"/>
    </g>
    <path d="M70 900h660" stroke="#6f685e" stroke-width="2" opacity="0.5"/>
  </g>`,
  { bg1: "#eee9df", bg2: "#ddd6c9", ink: "#4c4841" },
);

art["material-placeholder"] = frame(
  `
  <g>
    <rect x="90" y="90" width="620" height="820" fill="#f1ebdf"/>
    <g stroke="#b4552d" stroke-opacity="0.25" stroke-width="1">
      ${Array.from({ length: 13 }, (_, i) => `<path d="M${90 + i * 50} 90v820"/>`).join("")}
      ${Array.from({ length: 16 }, (_, i) => `<path d="M90 ${90 + i * 50}h620"/>`).join("")}
    </g>
    <circle cx="400" cy="460" r="150" fill="none" stroke="#1e3a2f" stroke-width="2"/>
    <path d="M330 500V420l70-55 70 55v80z" fill="none" stroke="#1e3a2f" stroke-width="3"/>
    <path d="M370 500v-50h60v50" fill="none" stroke="#b4552d" stroke-width="3"/>
    <path d="M290 620h220" stroke="#1e3a2f" stroke-width="2" opacity="0.5"/>
    <text x="400" y="680" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#1e3a2f" opacity="0.65" letter-spacing="6">MAKE MY HOME</text>
  </g>`,
  { bg1: "#f6f1e7", bg2: "#e8e0d1", ink: "#1e3a2f" },
);

for (const [name, svg] of Object.entries(art)) {
  writeFileSync(join(outDir, `${name}.svg`), svg.trim() + "\n");
}

console.log(`Wrote ${Object.keys(art).length} material illustrations to ${outDir}`);
