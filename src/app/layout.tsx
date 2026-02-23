import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import { InAppBrowserGate } from "@/components/in-app-browser-gate";

const sora = localFont({
  src: "../fonts/Sora-VariableFont_wght.ttf",
  variable: "--font-geist-sans",
  weight: "100 800",
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
        className={`${sora.variable} antialiased`}
      >
        {/* Inline splash blocker: covers screen with blue before React hydrates (PWA only) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;if(s&&!sessionStorage.getItem("splash-shown")){var d=document.createElement("div");d.id="splash-pre";d.style.cssText="position:fixed;inset:0;z-index:99998;background:#3b82f6";document.currentScript.after(d)}})()`,
          }}
        />
        <Providers>
          <InAppBrowserGate />
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
