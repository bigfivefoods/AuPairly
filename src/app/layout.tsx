import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Navbar, Footer } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { MobileNav } from "@/components/mobile-nav";
import { PwaProvider } from "@/components/pwa-provider";
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

export const metadata: Metadata = {
  title: {
    default: "AuPairly — Trusted au pairs & families, verified",
    template: "%s · AuPairly",
  },
  description:
    "AuPairly is the beautiful marketplace where verified au pairs and families find each other. Register, verify, browse, message, and match with confidence.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"),
  manifest: "/manifest.webmanifest",
  applicationName: "AuPairly",
  appleWebApp: {
    capable: true,
    title: "AuPairly",
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
    title: "AuPairly — Trusted au pairs & families",
    description: "Verified matches between au pairs and host families worldwide.",
    url: "https://www.aupairly.me",
    siteName: "AuPairly",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground overscroll-none">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
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
