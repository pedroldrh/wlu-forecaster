import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { CATEGORY_LABELS, getQuestionEmoji } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Forecaster market preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: question } = await supabase
    .from("questions")
    .select("title, category, status, resolved_outcome")
    .eq("id", id)
    .single();

  if (!question) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#0a0a0a",
            color: "#fff",
            fontSize: 48,
            fontFamily: "Sora",
          }}
        >
          Market not found
        </div>
      ),
      { ...size }
    );
  }

  // Compute consensus
  const { data: forecasts } = await supabase
    .from("forecasts")
    .select("probability")
    .eq("question_id", id);

  const forecastCount = forecasts?.length ?? 0;
  let consensus: number | null = null;
  if (forecastCount > 0) {
    const sum = forecasts!.reduce((s, f) => s + f.probability, 0);
    consensus = Math.round((sum / forecastCount) * 100);
  }

  const emoji = getQuestionEmoji(question.title, question.category);
  const categoryLabel = CATEGORY_LABELS[question.category] || question.category;

  // Status badge
  let statusText: string;
  let statusBg: string;
  let statusColor: string;
  if (question.status === "RESOLVED") {
    statusText = `Resolved ${question.resolved_outcome ? "YES" : "NO"}`;
    statusBg = question.resolved_outcome ? "#16a34a20" : "#dc262620";
    statusColor = question.resolved_outcome ? "#22c55e" : "#ef4444";
  } else if (question.status === "OPEN") {
    statusText = "Open";
    statusBg = "#16a34a20";
    statusColor = "#22c55e";
  } else {
    statusText = "Closed";
    statusBg = "#71717a20";
    statusColor = "#a1a1aa";
  }

  const fontData = await fetch(
    new URL("../../../fonts/Sora-VariableFont_wght.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          padding: "48px 56px",
          fontFamily: "Sora",
        }}
      >
        {/* Top row: logo + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="#3b82f6"
            >
              <rect x="3" y="13" width="4" height="8" rx="2" />
              <rect x="10" y="3" width="4" height="18" rx="2" />
              <rect x="17" y="8" width="4" height="13" rx="2" />
            </svg>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>Forecaster</span>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: statusBg,
              border: `1px solid ${statusColor}40`,
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: 20,
              fontWeight: 600,
              color: statusColor,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: statusColor,
              }}
            />
            {statusText}
          </div>
        </div>

        {/* Category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "48px",
            fontSize: 22,
            color: "#a1a1aa",
          }}
        >
          <span>{emoji}</span>
          <span>{categoryLabel}</span>
        </div>

        {/* Question title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <span
            style={{
              fontSize: question.title.length > 80 ? 40 : question.title.length > 50 ? 48 : 56,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {question.title}
          </span>
        </div>

        {/* Bottom row: consensus + domain */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            {consensus !== null ? (
              <>
                <span style={{ fontSize: 64, fontWeight: 700, color: "#3b82f6" }}>
                  {consensus}%
                </span>
                <span style={{ fontSize: 22, color: "#71717a" }}>consensus</span>
              </>
            ) : (
              <span style={{ fontSize: 28, color: "#71717a" }}>
                {forecastCount} forecast{forecastCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <span style={{ fontSize: 20, color: "#52525b" }}>wluforcaster.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Sora",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
