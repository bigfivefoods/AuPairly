import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppChrome } from "@/components/app-chrome";
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
    // Circular lite logo (transparent corners). Cache-bust when icon art changes.
    // PNG + SVG first (modern browsers); classic .ico last for legacy.
    icon: [
      { url: "/favicon-32.png?v=circle1", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png?v=circle1", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon.svg?v=circle1", type: "image/svg+xml" },
      { url: "/icon.png?v=circle1", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.png?v=circle1", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico?v=circle1", sizes: "any" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png?v=circle1",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon-32.png?v=circle1",
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
        // Static PNG with AuPairly name (public/og-share.png)
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
    // Meta Business / Facebook domain verification
    "facebook-domain-verification": "6j1kqmmu5bfwfwrxshraad5s0h71f1",
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
          <AppChrome>{children}</AppChrome>
          <PwaProvider />
        </Providers>
      </body>
    </html>
  );
}
