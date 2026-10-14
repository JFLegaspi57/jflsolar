import type { Metadata, Viewport } from "next";
import { Archivo, Source_Sans_3 } from "next/font/google";
import { isProductionSite, siteUrl } from "@/lib/env";
import { brand } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], display: "swap" });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  robots: isProductionSite ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#333f4f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PH" className={`${archivo.variable} ${sourceSans.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded bg-gold-500 px-4 py-3 font-semibold text-steel-950 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
