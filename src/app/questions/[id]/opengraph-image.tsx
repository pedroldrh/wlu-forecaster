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

  const fontData = await fetch(
    new URL("../../../fonts/Sora-VariableFont_wght.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

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
      { ...size, fonts: [{ name: "Sora", data: fontData, style: "normal" as const, weight: 400 }] }
    );
  }

  // Compute YES %
  const { data: forecasts } = await supabase
    .from("forecasts")
    .select("probability")
    .eq("question_id", id);

  const forecastCount = forecasts?.length ?? 0;
  let yesPct: number | null = null;
  if (forecastCount > 0) {
    const yesVotes = forecasts!.filter((f) => f.probability >= 0.5).length;
    yesPct = Math.round((yesVotes / forecastCount) * 100);
  }

  const emoji = getQuestionEmoji(question.title, question.category);
  const categoryLabel = CATEGORY_LABELS[question.category] || question.category;

  // Status config
  let statusText: string;
  let statusColor: string;
  let statusDot: string;
  if (question.status === "RESOLVED") {
    statusText = question.resolved_outcome ? "YES" : "NO";
    statusColor = question.resolved_outcome ? "#22c55e" : "#ef4444";
    statusDot = statusColor;
  } else if (question.status === "OPEN") {
    statusText = "Open";
    statusColor = "#22c55e";
    statusDot = "#22c55e";
  } else {
    statusText = "Closed";
    statusColor = "#a1a1aa";
    statusDot = "#a1a1aa";
  }

  // Dynamic font size based on title length
  const titleSize = question.title.length > 90 ? 36 : question.title.length > 60 ? 42 : question.title.length > 40 ? 48 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          fontFamily: "Sora",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient accent */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "52px 60px",
            position: "relative",
          }}
        >
          {/* Top bar: logo + category + status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6">
                <rect x="3" y="13" width="4" height="8" rx="2" />
                <rect x="10" y="3" width="4" height="18" rx="2" />
                <rect x="17" y="8" width="4" height="13" rx="2" />
              </svg>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6", letterSpacing: "-0.02em" }}>
                Forecaster
              </span>
              <div style={{ display: "flex", width: 1, height: 24, backgroundColor: "#ffffff15", marginLeft: 4, marginRight: 4 }} />
              <span style={{ fontSize: 18, color: "#71717a" }}>
                {emoji} {categoryLabel}
              </span>
            </div>

            {/* Status pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "9999px",
                padding: "6px 18px",
                fontSize: 18,
                fontWeight: 600,
                color: statusColor,
                border: `1.5px solid ${statusColor}50`,
                backgroundColor: `${statusColor}12`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusDot }} />
              {question.status === "RESOLVED" ? `Resolved ${statusText}` : statusText}
            </div>
          </div>

          {/* Question title — centered vertically */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              paddingRight: 40,
            }}
          >
            <span
              style={{
                fontSize: titleSize,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
            >
              {question.title}
            </span>
          </div>

          {/* Bottom bar: YES % / forecasts + CTA + domain */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              {yesPct !== null ? (
                <>
                  <span style={{ fontSize: 60, fontWeight: 700, color: "#3b82f6", letterSpacing: "-0.03em" }}>
                    {yesPct}%
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 500, color: "#71717a" }}>
                    voted YES from {forecastCount} forecaster{forecastCount !== 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 24, fontWeight: 500, color: "#71717a" }}>
                  No predictions yet — be the first
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#3b82f6",
                borderRadius: "9999px",
                padding: "10px 24px",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              Make your prediction
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 4,
            background: "linear-gradient(90deg, #3b82f6, #6366f1, #3b82f6)",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Sora",
          data: fontData,
          style: "normal" as const,
          weight: 400,
        },
      ],
    }
  );
}
