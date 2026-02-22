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
          background: "linear-gradient(145deg, #0a0a0a 0%, #0f172a 40%, #1e1b4b 70%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "16px",
          }}
        >
          {/* BarChart3 icon */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Forecaster
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: "#94a3b8",
            marginBottom: "48px",
            letterSpacing: "0.05em",
          }}
        >
          Predict campus events. Win real prizes.
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 48px",
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 700, color: "#22c55e" }}>Free</span>
            <span style={{ fontSize: 18, color: "#94a3b8", marginTop: "4px" }}>to play</span>
          </div>
          <div
            style={{
              width: "1px",
              background: "rgba(255,255,255,0.1)",
              alignSelf: "stretch",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 48px",
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 700, color: "#f59e0b" }}>$1,000+</span>
            <span style={{ fontSize: 18, color: "#94a3b8", marginTop: "4px" }}>in prizes</span>
          </div>
          <div
            style={{
              width: "1px",
              background: "rgba(255,255,255,0.1)",
              alignSelf: "stretch",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 48px",
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 700, color: "#3b82f6" }}>Biweekly</span>
            <span style={{ fontSize: 18, color: "#94a3b8", marginTop: "4px" }}>payouts</span>
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: 18,
            color: "#64748b",
            letterSpacing: "0.1em",
          }}
        >
          Washington & Lee University
        </div>
      </div>
    ),
    { ...size }
  );
}
