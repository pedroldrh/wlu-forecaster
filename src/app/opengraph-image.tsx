import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Forecaster — W&L Campus Predictions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span style={{ fontSize: 64, fontWeight: 800, color: "white" }}>
            Forecaster
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginBottom: "40px",
          }}
        >
          W&L Campus Forecasting Tournament
        </div>
        <div
          style={{
            display: "flex",
            gap: "48px",
            fontSize: 22,
            color: "#d4d4d8",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#22c55e" }}>FREE</span>
            <span>Entry</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>$1,000</span>
            <span>Prize Pool</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>W&L</span>
            <span>Students</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
