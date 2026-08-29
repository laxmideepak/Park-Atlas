import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s` },
  description:
    "Discover which U.S. National Park to visit and when, using transparent, versioned scores built from official NPS, NOAA, and USGS data.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#131711",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${instrumentSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bone text-ink">
        <SmoothScroll>
          <div className="bg-ink text-bone/70 text-[0.65rem] tracking-wide uppercase text-center py-1.5 px-4 font-mono">
            An independent guide to the U.S. National Park System &mdash; not an official NPS product
          </div>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
