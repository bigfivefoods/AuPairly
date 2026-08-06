import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Navbar, Footer } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { MobileNav } from "@/components/mobile-nav";
import { PwaProvider } from "@/components/pwa-provider";
import { BRAND } from "@/lib/brand";
import { getRequestLocale } from "@/lib/i18n/server";
import { LOCALE_META } from "@/lib/i18n/config";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f766e" },
    { media: "(prefers-color-scheme: dark)", color: "#0f766e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_URL ||
  "https://aupairly-orcin.vercel.app";

export const metadata: Metadata = {
  title: {
    default: BRAND.ogTitle,
    template: `%s · ${BRAND.name}`,
  },
  description: `${BRAND.tagline} ${BRAND.description}`,
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  applicationName: BRAND.name,
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: BRAND.ogTitle,
    description: BRAND.tagline,
    url: siteUrl,
    siteName: "AuPairly",
    type: "website",
    locale: "en_US",
    images: [
      {
        // Static PNG always shows the AuPairly name (dynamic route also available)
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "AuPairly — Trusted care for your family, loved ones, home & pets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.ogTitle,
    description: BRAND.tagline,
    site: "@aupairly",
    images: [
      {
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "AuPairly — Trusted care for your family, loved ones, home & pets",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();
  const dir = LOCALE_META[locale].dir;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 flex-col bg-background text-foreground overscroll-none">
        <Providers locale={locale}>
          <Navbar />
          <main className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <PwaProvider />
        </Providers>
      </body>
    </html>
  );
}
