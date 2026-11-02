import type { Metadata } from "next";
import { QuantityCalculator } from "@/components/quantity-calculator";

export const metadata: Metadata = {
  title: "Quantity calculator",
  robots: { index: true, follow: true },
};

export default function CalculatorPage() {
  return (
    <div className="flex justify-center px-4 py-12">
      <QuantityCalculator />
    </div>
  );
}