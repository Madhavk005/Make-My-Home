"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

const SERVED_PINCODES = [
  "302001", "302002", "302003", "302004", "302005", "302006", "302012", "302015",
  "302017", "302018", "302019", "302020", "302021", "302022", "302029", "302033",
  "302034", "302039",
];

export function DeliveryChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<null | "served" | "unserved">(null);

  function check() {
    const clean = pincode.replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) {
      setResult(null);
      return;
    }
    setResult(SERVED_PINCODES.includes(clean) ? "served" : "unserved");
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Delivery availability</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Enter your 6-digit pincode to check whether we deliver to your area.
      </p>
      <div className="mt-6 flex gap-2">
        <input
          value={pincode}
          onChange={(event) => setPincode(event.target.value)}
          placeholder="302001"
          inputMode="numeric"
          maxLength={6}
          className="min-h-12 flex-1 rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={check}
          className="btn-primary inline-flex min-h-12 items-center gap-2 px-4"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Check
        </button>
      </div>
      {result === "served" ? (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Great news — we deliver to your area. Place your enquiry and we&apos;ll confirm the delivery timeline.
        </p>
      ) : null}
      {result === "unserved" ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          We don&apos;t currently deliver to this pincode, but you can still enquire — we may arrange pickup or a courier.
        </p>
      ) : null}
    </section>
  );
}