import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Navbar, Footer } from "@/components/navbar";
import { Providers } from "@/components/providers";
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

export const metadata: Metadata = {
  title: {
    default: "AuPairly — Trusted au pairs & families, verified",
    template: "%s · AuPairly",
  },
  description:
    "AuPairly is the beautiful marketplace where verified au pairs and families find each other. Register, verify, browse, message, and match with confidence.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"),
  openGraph: {
    title: "AuPairly — Trusted au pairs & families",
    description: "Verified matches between au pairs and host families worldwide.",
    url: "https://www.aupairly.me",
    siteName: "AuPairly",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
