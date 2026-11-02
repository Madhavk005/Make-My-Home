
"use client";

import type { ReactNode } from "react";
import { EnquiryProvider } from "./enquiry-provider";
import { CompareProvider } from "./compare-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <EnquiryProvider>
      <CompareProvider>{children}</CompareProvider>
    </EnquiryProvider>
  );
}
