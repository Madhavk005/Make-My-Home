"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { EnquiryProvider } from "./enquiry-provider";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function Providers({ children }: { children: ReactNode }) {
  const content = <EnquiryProvider>{children}</EnquiryProvider>;

  if (!publishableKey) return content;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#b84a16",
          colorForeground: "#1c1a17",
          colorBackground: "#f8f5ef",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        },
      }}
    >
      {content}
    </ClerkProvider>
  );
}
