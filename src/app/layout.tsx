import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppChrome } from "@/components/app-chrome";
import { PwaProvider } from "@/components/pwa-provider";
import { BRAND } from "@/lib/brand";
import { getRequestLocale } from "@/lib/i18n/server";
import { LOCALE_META } from "@/lib/i18n/config";
import { PUBLIC_SITE_URL, SEO } from "@/lib/seo";
import { AnalyticsScripts } from "@/components/analytics-scripts";
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

const siteUrl = PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.defaultDescription,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: siteUrl }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: "marketplace",
  keywords: [...SEO.keywords],
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
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
  alternates: {
    canonical: siteUrl,
    languages: {
      "en": siteUrl,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    title: SEO.defaultTitle,
    description: BRAND.tagline,
    url: siteUrl,
    siteName: BRAND.name,
    type: "website",
    locale: SEO.locale,
    images: [
      {
        url: SEO.ogImage.url,
        width: SEO.ogImage.width,
        height: SEO.ogImage.height,
        alt: SEO.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: BRAND.tagline,
    site: SEO.twitter,
    creator: SEO.twitter,
    images: [
      {
        url: SEO.ogImage.url,
        width: SEO.ogImage.width,
        height: SEO.ogImage.height,
        alt: SEO.ogImage.alt,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Add Google Search Console token via env when available
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    "mobile-web-app-capable": "yes",
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Providers locale={locale}>
          <AppChrome>{children}</AppChrome>
          <PwaProvider />
          <AnalyticsScripts />
        </Providers>
      </body>
    </html>
  );
}
