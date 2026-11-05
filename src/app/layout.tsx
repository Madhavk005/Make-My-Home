import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Geist_Mono,
  Manrope,
  Mukta,
  Noto_Serif_Devanagari,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@/components/analytics";
import { getLocale } from "@/lib/locale";
import { getSiteOrigin } from "@/lib/site-origin";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-devanagari-display",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Make My Home — निर्माण सामग्री, भरोसे के साथ",
    template: "%s · Make My Home",
  },
  description:
    "नींव से फिनिशिंग तक — सीमेंट, सरिया, पत्थर, टाइल्स, तार, पाइप और घर का हर सामान। सामान चुनें, मात्रा बताएँ और दुकानदार से WhatsApp पर सीधे बात करें।",
  applicationName: "Make My Home",
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "hi_IN",
    siteName: "Make My Home",
    title: "Make My Home — निर्माण सामग्री, भरोसे के साथ",
    description:
      "घर बनाने का हर सामान — सीमेंट, सरिया, पत्थर, टाइल्स, तार, पाइप और फिनिशिंग। दुकानदार से सीधे WhatsApp पर कीमत पूछें।",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ea",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale === "hi" ? "hi-IN" : "en-IN"}
      className={`${fraunces.variable} ${manrope.variable} ${mukta.variable} ${notoSerifDevanagari.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
