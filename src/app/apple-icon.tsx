import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          borderRadius: "36px",
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="white"
        >
          <rect x="3" y="13" width="4" height="8" rx="2" />
          <rect x="10" y="3" width="4" height="18" rx="2" />
          <rect x="17" y="8" width="4" height="13" rx="2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
