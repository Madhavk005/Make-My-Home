import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { QuotePayment } from "@/components/quote-payment";
import { getSiteSettings } from "@/lib/catalogue";
import { formatINR } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { isQuoteToken, loadQuoteByToken, syncOpenPayment } from "@/lib/quote-payments";
import { getSettingWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { isPaymentCheckoutAvailable } from "@/lib/youpi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approved quotation",
  robots: { index: false, follow: false },
};

export default async function ApprovedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!isQuoteToken(token)) notFound();

  const [quote, locale, settings] = await Promise.all([
    loadQuoteByToken(token),
    getLocale(),
    getSiteSettings().catch(() => null),
  ]);

  if (!quote) notFound();

  const payment =
    quote.payment && quote.payment.status !== "paid"
      ? await syncOpenPayment(quote).catch(() => quote.payment)
      : quote.payment;

  const hi = locale === "hi";
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const phone = settings?.phone?.trim() || null;
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(
        whatsappNumber,
        hi
          ? `नमस्ते ${businessName}, मेरे कोटेशन ${quote.reference} के बारे में बात करनी है।`
          : `Hello ${businessName}, I would like to talk about quotation ${quote.reference}.`,
      )
    : null;

  const amount = quote.quoteAmount ?? 0;

  return (
    <main className="container section-sm">
      <div className="mx-auto max-w-2xl">
        <p className="type-eyebrow">
          {hi ? "स्वीकृत कोटेशन" : "Approved quotation"} · {quote.reference}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {hi ? "दुकान ने आपका कोटेशन स्वीकृत किया" : "Your quotation is approved"}
        </h1>

        {quote.quoteReply ? (
          <section className="mt-5 rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-bold text-ink">
              {hi ? "दुकान का जवाब" : "Message from the shop"}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {quote.quoteReply}
            </p>
          </section>
        ) : null}

        <section className="mt-5 rounded-xl border border-line bg-stone-50 p-5">
          <p className="text-sm font-semibold text-ink-soft">
            {hi ? "स्वीकृत राशि" : "Approved amount"}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{formatINR(amount)}</p>
          {quote.quoteApprovedAt ? (
            <p className="mt-1 text-xs text-ink-soft">
              {hi ? "स्वीकृत" : "Approved"}{" "}
              {new Date(quote.quoteApprovedAt).toLocaleDateString(hi ? "hi-IN" : "en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}
        </section>

        <div className="mt-5">
          <QuotePayment
            token={token}
            amount={amount}
            initialStatus={payment?.status ?? (quote.status === "converted" ? "paid" : null)}
            initialUtr={payment?.utr ?? null}
            checkoutAvailable={isPaymentCheckoutAvailable()}
            locale={locale}
            phoneHref={phoneHref}
          />
        </div>

        <section className="mt-6 rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-bold text-ink">
            {hi ? "भुगतान के बारे में मदद चाहिए?" : "Need help with the payment?"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {hi
              ? "भुगतान की पुष्टि दुकान बैंक खाते में पैसे देखकर करती है। कोई भी सवाल हो तो सीधे दुकान से बात करें।"
              : "The shop confirms every payment by checking the bank account. Talk to the shop directly if you have any question."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {phoneHref ? (
              <a href={phoneHref} className="btn btn-secondary">
                <Phone aria-hidden className="h-4 w-4" />
                {hi ? "कॉल करें" : "Call"}
              </a>
            ) : null}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <MessageCircle aria-hidden className="h-4 w-4" />
                {hi ? "WhatsApp पर पूछें" : "Ask on WhatsApp"}
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
