import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Forecaster — W&L Campus Predictions",
  description:
    "Free campus forecasting tournament at Washington & Lee. Predict campus events, compete on the leaderboard, and win prizes every 2 weeks.",
  metadataBase: new URL("https://wluforcaster.com"),
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
