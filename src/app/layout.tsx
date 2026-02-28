import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { InAppBrowserGate } from "@/components/in-app-browser-gate";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const sora = localFont({
  src: "../fonts/Sora-VariableFont_wght.ttf",
  variable: "--font-geist-sans",
  weight: "100 800",
});

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Forecaster — W&L Campus Predictions",
  description:
    "Free campus forecasting tournament at Washington & Lee. Predict campus events, compete on the leaderboard, and win prizes every 2 weeks.",
  metadataBase: new URL("https://wluforcaster.com"),
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forecaster",
  },
  openGraph: {
    title: "Forecaster — W&L Campus Predictions",
    description:
      "Free campus forecasting tournament at Washington & Lee. Predict campus events, compete on the leaderboard, and win prizes every 2 weeks.",
    siteName: "Forecaster",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forecaster — W&L Campus Predictions",
    description:
      "Free campus forecasting tournament at W&L. Predict campus events and win prizes every 2 weeks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} antialiased`}
        style={{ backgroundColor: '#3b82f6' }}
      >
        <Providers>
          <InAppBrowserGate />
          <Nav />
          <main className="max-w-7xl mx-auto px-4 pt-6">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
