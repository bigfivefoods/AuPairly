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
    default: "AuPairly — Childcare, house sitting & pet sitting",
    template: "%s · AuPairly",
  },
  description:
    "AuPairly.me is the single marketplace for verified childcare / au pairing, house sitting, and pet sitting. Match, message, and book with confidence worldwide.",
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
    title: "AuPairly — Childcare, house sitting & pet sitting",
    description:
      "One marketplace for au pairs, house sitters, and pet sitters — and the hosts who need them.",
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
