"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

type Tab = "cement" | "tiles" | "pipe" | "aggregate";

export function QuantityCalculator() {
  const [tab, setTab] = useState<Tab>("cement");

  // Cement
  const [area, setArea] = useState("");
  const [thickness, setThickness] = useState("0.1");
  // Tiles
  const [floorArea, setFloorArea] = useState("");
  const [tileLength, setTileLength] = useState("0.6");
  const [tileWidth, setTileWidth] = useState("0.6");
  const [waste, setWaste] = useState("10");
  // Pipe
  const [pipeLength, setPipeLength] = useState("");
  const [pipeStd, setPipeStd] = useState("3");
  // Aggregate
  const [aggVolume, setAggVolume] = useState("");

  const cementBags = (() => {
    const a = Number(area);
    const t = Number(thickness);
    if (!a || !t) return null;
    const volume = a * t;
    const kg = volume * 1440;
    return Math.ceil(kg / 50);
  })();

  const tilesNeeded = (() => {
    const a = Number(floorArea);
    const tl = Number(tileLength);
    const tw = Number(tileWidth);
    const w = Number(waste);
    if (!a || !tl || !tw) return null;
    const tileArea = tl * tw;
    const base = a / tileArea;
    return Math.ceil(base * (1 + (w || 0) / 100));
  })();

  const pipesNeeded = (() => {
    const l = Number(pipeLength);
    const s = Number(pipeStd);
    if (!l || !s) return null;
    return Math.ceil(l / s);
  })();

  const aggregateKg = (() => {
    const v = Number(aggVolume);
    if (!v) return null;
    return Math.ceil(v * 1440);
  })();

  const tabs: { id: Tab; label: string }[] = [
    { id: "cement", label: "Cement" },
    { id: "tiles", label: "Tiles" },
    { id: "pipe", label: "Pipes" },
    { id: "aggregate", label: "Aggregates" },
  ];

  return (
    <section className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Quantity calculator</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Estimate material quantities before you place an enquiry.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              tab === item.id
                ? "border-forest bg-forest text-surface"
                : "border-line text-ink hover:border-forest"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tab === "cement" ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Area (sq m)</label>
              <input value={area} onChange={(e) => setArea(e.target.value)} type="number" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Thickness (m)</label>
              <input value={thickness} onChange={(e) => setThickness(e.target.value)} type="number" step="0.01" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            {cementBags !== null ? (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                You need approximately <strong>{cementBags} bags</strong> of cement (50 kg each).
              </p>
            ) : null}
          </>
        ) : null}

        {tab === "tiles" ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Floor area (sq m)</label>
              <input value={floorArea} onChange={(e) => setFloorArea(e.target.value)} type="number" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Tile length (m)</label>
                <input value={tileLength} onChange={(e) => setTileLength(e.target.value)} type="number" step="0.01" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">Tile width (m)</label>
                <input value={tileWidth} onChange={(e) => setTileWidth(e.target.value)} type="number" step="0.01" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Waste (%)</label>
              <input value={waste} onChange={(e) => setWaste(e.target.value)} type="number" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            {tilesNeeded !== null ? (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                You need approximately <strong>{tilesNeeded} tiles</strong> (including waste).
              </p>
            ) : null}
          </>
        ) : null}

        {tab === "pipe" ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Required length (m)</label>
              <input value={pipeLength} onChange={(e) => setPipeLength(e.target.value)} type="number" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Standard pipe length (m)</label>
              <input value={pipeStd} onChange={(e) => setPipeStd(e.target.value)} type="number" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            {pipesNeeded !== null ? (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                You need approximately <strong>{pipesNeeded} pipes</strong>.
              </p>
            ) : null}
          </>
        ) : null}

        {tab === "aggregate" ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Volume (cubic m)</label>
              <input value={aggVolume} onChange={(e) => setAggVolume(e.target.value)} type="number" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
            </div>
            {aggregateKg !== null ? (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                You need approximately <strong>{aggregateKg} kg</strong> of aggregate.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}