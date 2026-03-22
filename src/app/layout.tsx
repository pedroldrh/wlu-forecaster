import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { InAppBrowserGate } from "@/components/in-app-browser-gate";
import { PwaGate } from "@/components/pwa-gate";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { createAdminClient } from "@/lib/supabase/server";

const sora = localFont({
  src: "../fonts/Sora-VariableFont_wght.ttf",
  variable: "--font-geist-sans",
  weight: "100 800",
});

export const viewport: Viewport = {
  themeColor: "#000000",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch season info for the PWA gate install page
  let seasonInfo: { name: string; totalPrizeCents: number } | null = null;
  try {
    const supabase = await createAdminClient();
    const { data: season } = await supabase
      .from("seasons")
      .select("name, prize_1st_cents, prize_2nd_cents, prize_3rd_cents, prize_4th_cents, prize_5th_cents, prize_bonus_cents")
      .eq("status", "LIVE")
      .single();
    if (season) {
      seasonInfo = {
        name: season.name,
        totalPrizeCents:
          (season.prize_1st_cents || 0) +
          (season.prize_2nd_cents || 0) +
          (season.prize_3rd_cents || 0) +
          (season.prize_4th_cents || 0) +
          (season.prize_5th_cents || 0) +
          (season.prize_bonus_cents || 0),
      };
    }
  } catch {}

  return (
    <html lang="en">
      <body
        className={`${sora.variable} antialiased`}
        style={{ backgroundColor: '#000' }}
      >
        <PwaGate seasonInfo={seasonInfo}>
          <Providers>
            <InAppBrowserGate />
            <Nav />
            <main className="max-w-7xl mx-auto px-4 pt-6 min-h-screen">{children}</main>
            <Footer />
            <BottomNav />
          </Providers>
        </PwaGate>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
