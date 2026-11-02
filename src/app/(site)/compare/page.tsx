import type { Metadata } from "next";
import { ComparePage } from "@/components/compare-page";

export const metadata: Metadata = {
  title: "Compare products",
  robots: { index: false, follow: true },
};

export default function CompareRoute() {
  return <ComparePage />;
}