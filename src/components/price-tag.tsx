import { priceDisplay } from "@/lib/format";
import { variantCountLabel } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import type { PriceStatus } from "@/lib/types";

type PriceTagProps = {
  price?: number | null;
  priceStatus?: PriceStatus | null;
  unit: string;
  fromPrice?: number | null;
  variantCount?: number | null;
  size?: "card" | "detail";
  showNote?: boolean;
};

export async function PriceTag({
  price,
  priceStatus,
  unit,
  fromPrice,
  variantCount,
  size = "card",
  showNote = false,
}: PriceTagProps) {
  const locale = await getLocale();
  const display = priceDisplay({ price, priceStatus, unit, fromPrice, variantCount }, locale);
  const isDetail = size === "detail";

  return (
    <div>
      <p
        className={
          isDetail
            ? "flex flex-wrap items-baseline gap-x-2 font-display text-4xl font-medium tracking-[-0.03em] text-ink"
            : display.isNumeric
              ? "flex flex-wrap items-baseline gap-x-1.5 text-[1.05rem] font-bold tracking-[-0.02em] text-ink"
              : "flex flex-wrap items-baseline gap-x-1.5 text-sm font-bold tracking-[-0.01em] text-primary-deep"
        }
      >
        <span>{display.primary}</span>
        {display.suffix ? (
          <span
            className={
              isDetail ? "text-base font-medium text-ink-soft" : "text-[11px] font-medium text-ink-soft"
            }
          >
            {display.suffix}
          </span>
        ) : null}
      </p>
      {display.note && (showNote || !display.isNumeric) ? (
        <p className={`${isDetail ? "mt-1.5 text-sm" : "mt-0.5 text-[10px]"} text-ink-soft`}>
          {display.note}
        </p>
      ) : null}
      {variantCount && variantCount > 1 && display.isFrom ? (
        <p className="mt-1 text-[11px] text-ink-soft">{variantCountLabel(variantCount, locale)}</p>
      ) : null}
    </div>
  );
}
