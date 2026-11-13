"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import { formatINR } from "@/lib/format";

type PaymentStatus = "pending" | "review" | "paid" | "failed" | "refunded";

type QuoteStatusResponse = {
  quoteAmount: number | null;
  status: string;
  checkoutAvailable: boolean;
  payment: {
    status: PaymentStatus;
    amount: number;
    utr: string | null;
    confirmedAt: string | null;
  } | null;
};

const POLL_MS = 10_000;

export function QuotePayment({
  token,
  amount,
  initialStatus,
  initialUtr,
  checkoutAvailable,
  locale,
  phoneHref,
}: {
  token: string;
  amount: number;
  initialStatus: PaymentStatus | null;
  initialUtr: string | null;
  checkoutAvailable: boolean;
  locale: "hi" | "en";
  phoneHref: string | null;
}) {
  const hi = locale === "hi";
  const [status, setStatus] = useState<PaymentStatus | null>(initialStatus);
  const [utr, setUtr] = useState<string | null>(initialUtr);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotes/${token}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as QuoteStatusResponse;
      if (!mounted.current) return;
      setStatus(data.payment?.status ?? null);
      setUtr(data.payment?.utr ?? null);
    } catch {
      // Polling is a convenience; a network blip must not show an error.
    }
  }, [token]);

  const shouldPoll = status === "pending" || status === "review";

  useEffect(() => {
    if (!shouldPoll) return;
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh, shouldPoll]);

  async function startPayment() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/quotes/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        setError(
          data.error ??
            (hi
              ? "ऑनलाइन भुगतान शुरू नहीं हो सका। कृपया दुकान को कॉल करें।"
              : "Could not start the online payment. Please call the shop."),
        );
        return;
      }

      window.location.assign(data.checkoutUrl);
    } catch {
      setError(
        hi
          ? "इंटरनेट कनेक्शन जाँचें और फिर कोशिश करें।"
          : "Check your internet connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (status === "paid") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 text-base font-bold text-emerald-900">
          <CheckCircle2 aria-hidden className="h-5 w-5" />
          {hi ? "भुगतान मिल गया" : "Payment received"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          {hi
            ? `दुकान ने ${formatINR(amount)} का भुगतान जाँच कर पुष्टि कर दी है। अब डिलीवरी की बात दुकान से करें।`
            : `The shop has verified your ${formatINR(amount)} payment. Please coordinate delivery with the shop.`}
        </p>
        {phoneHref ? (
          <a href={phoneHref} className="btn btn-primary mt-4">
            <Phone aria-hidden className="h-4 w-4" />
            {hi ? "दुकान को कॉल करें" : "Call the shop"}
          </a>
        ) : null}
      </div>
    );
  }

  if (status === "review") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="flex items-center gap-2 text-base font-bold text-amber-950">
          <Clock aria-hidden className="h-5 w-5" />
          {hi ? "भुगतान जाँचा जा रहा है" : "Payment is being verified"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-950">
          {hi
            ? "आपका UPI रेफरेंस दुकान तक पहुँच गया है। दुकान बैंक खाते में पैसे देखकर पुष्टि करेगी।"
            : "Your UPI reference has reached the shop. The shop will confirm it after checking the bank account."}
        </p>
        {utr ? (
          <p className="mt-3 text-sm font-semibold text-amber-950">
            {hi ? "UPI रेफरेंस" : "UPI reference"}: <span className="font-mono">{utr}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="type-eyebrow">{hi ? "भुगतान" : "Payment"}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{formatINR(amount)}</p>

      {status === "failed" ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {hi
            ? "पिछला भुगतान पूरा नहीं हुआ। आप फिर से कोशिश कर सकते हैं, या दुकान को कॉल करें।"
            : "The previous attempt did not complete. You can try again, or call the shop."}
        </p>
      ) : null}

      {checkoutAvailable ? (
        <>
          <button
            type="button"
            onClick={startPayment}
            disabled={busy}
            className="btn btn-primary mt-4 w-full"
          >
            {busy
              ? hi
                ? "भुगतान खुल रहा है…"
                : "Opening payment…"
              : hi
                ? `${formatINR(amount)} का भुगतान करें`
                : `Pay ${formatINR(amount)}`}
          </button>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {hi
              ? "UPI से भुगतान करें और UPI रेफरेंस दर्ज करें। दुकान बैंक खाते में पैसे देखकर भुगतान की पुष्टि करेगी।"
              : "Pay by UPI and enter the UPI reference. The shop confirms the payment after checking the bank account."}
          </p>
        </>
      ) : (
        <p className="mt-3 rounded-lg border border-line bg-stone-50 p-3 text-sm leading-relaxed text-ink-soft">
          {hi
            ? "ऑनलाइन भुगतान अभी उपलब्ध नहीं है। कृपया दुकान को कॉल करके भुगतान की बात करें।"
            : "Online payment is not available right now. Please call the shop to arrange payment."}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
