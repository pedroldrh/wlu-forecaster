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
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* App icon — same as apple-icon */}
        <div
          style={{
            width: "280px",
            height: "280px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            borderRadius: "56px",
            border: "3px solid rgba(255,255,255,0.1)",
          }}
        >
          <svg
            width="180"
            height="180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
