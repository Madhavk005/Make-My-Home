import type { Metadata } from "next";
import { DeliveryChecker } from "@/components/delivery-checker";

export const metadata: Metadata = {
  title: "Delivery availability",
  robots: { index: true, follow: true },
};

export default function DeliveryPage() {
  return (
    <div className="flex justify-center px-4 py-12">
      <DeliveryChecker />
    </div>
  );
}