"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendUp, TrendDown } from "@phosphor-icons/react";

interface ConsensusChartProps {
  data: { time: string; value: number }[];
  userProbability?: number | null;
}

const CHART_HEIGHT = 200;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 24;
const CHART_PADDING_LEFT = 0;
const CHART_PADDING_RIGHT = 40;

export function ConsensusChart({ data, userProbability = null }: ConsensusChartProps) {
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const latestTimestamp = data.length > 0 ? new Date(data[data.length - 1].time).getTime() : 0;
  const oneDayAgo = latestTimestamp - 24 * 60 * 60 * 1000;
  const value24hAgo = [...data].reverse().find((d) => new Date(d.time).getTime() <= oneDayAgo)?.value ?? data[0]?.value ?? latestValue;
  const delta24h = latestValue - value24hAgo;

  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: "", linePath: "", yLabels: [], xLabels: [] };

    const times = data.map((d) => new Date(d.time).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const drawH = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    function xPos(t: number, w: number) {
      return CHART_PADDING_LEFT + ((t - minTime) / timeRange) * (w - CHART_PADDING_LEFT - CHART_PADDING_RIGHT);
    }
    function yPos(v: number) {
      // v is 0-1, map to chart area (inverted: 0% at bottom, 100% at top)
      return CHART_PADDING_TOP + drawH * (1 - v);
    }

    // Use a reference width for path calculations — SVG viewBox handles scaling
    const W = 500;

    const points = data.map((d, i) => ({
      x: xPos(times[i], W),
      y: yPos(d.value),
      value: d.value,
      time: d.time,
    }));

    // Smooth line using catmull-rom to bezier
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Area path (line + close to bottom)
    const bottomY = yPos(0);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

    // Y axis labels
    const yLabels = [0, 25, 50, 75, 100].map((pct) => ({
      y: yPos(pct / 100),
      label: `${pct}%`,
    }));

    // X axis labels (3-5 evenly spaced dates)
    const numLabels = 4;
    const xLabels = [];
    for (let i = 0; i < numLabels; i++) {
      const t = minTime + (timeRange * i) / (numLabels - 1);
      const d = new Date(t);
      xLabels.push({
        x: xPos(t, W),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }

    return { points, areaPath, linePath, yLabels, xLabels, W };
  }, [data]);

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        {/* Legend */}
        <div className="px-5 pt-5 pb-0 relative z-10">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Community Consensus
          </p>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mt-1">
            <p className="text-4xl font-bold text-foreground font-mono tabular-nums">
              {data.length > 0 ? `${Math.round(latestValue * 100)}%` : "\u2014"}
            </p>
            <p className="text-xs text-muted-foreground h-4">
              {data.length > 0 ? "Latest" : ""}
            </p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              delta24h >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
            }`}>
              {delta24h >= 0 ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />}
              {delta24h >= 0 ? "+" : ""}{(delta24h * 100).toFixed(1)} pts (24h)
            </span>
            {userProbability !== null && userProbability !== undefined && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                You: {Math.round(userProbability * 100)}%
              </span>
            )}
          </div>
        </div>

        {data.length > 0 && chartData.W ? (
          <svg
            viewBox={`0 0 ${chartData.W} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: 200 }}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(37, 99, 235)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(37, 99, 235)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {chartData.yLabels.map((yl) => (
              <line
                key={yl.label}
                x1={CHART_PADDING_LEFT}
                y1={yl.y}
                x2={chartData.W - CHART_PADDING_RIGHT}
                y2={yl.y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
            ))}

            {/* Y axis labels */}
            {chartData.yLabels.map((yl) => (
              <text
                key={`label-${yl.label}`}
                x={chartData.W - CHART_PADDING_RIGHT + 6}
                y={yl.y + 3.5}
                fill="currentColor"
                fillOpacity="0.4"
                fontSize="10"
                fontFamily="ui-monospace, monospace"
              >
                {yl.label}
              </text>
            ))}

            {/* X axis labels */}
            {chartData.xLabels.map((xl, i) => (
              <text
                key={`x-${i}`}
                x={xl.x}
                y={CHART_HEIGHT - 4}
                fill="currentColor"
                fillOpacity="0.35"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {xl.label}
              </text>
            ))}

            {/* Area fill */}
            <path d={chartData.areaPath} fill="url(#areaGrad)" />

            {/* Line */}
            <path
              d={chartData.linePath}
              fill="none"
              stroke="rgb(37, 99, 235)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* User probability line */}
            {userProbability !== null && userProbability !== undefined && (
              <>
                <line
                  x1={CHART_PADDING_LEFT}
                  y1={CHART_PADDING_TOP + (CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) * (1 - userProbability)}
                  x2={chartData.W - CHART_PADDING_RIGHT}
                  y2={CHART_PADDING_TOP + (CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) * (1 - userProbability)}
                  stroke="rgb(16, 185, 129)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={chartData.W - CHART_PADDING_RIGHT + 6}
                  y={CHART_PADDING_TOP + (CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) * (1 - userProbability) + 3.5}
                  fill="rgb(16, 185, 129)"
                  fontSize="9"
                  fontFamily="ui-monospace, monospace"
                >
                  You
                </text>
              </>
            )}

            {/* Latest value dot */}
            {chartData.points.length > 0 && (
              <circle
                cx={chartData.points[chartData.points.length - 1].x}
                cy={chartData.points[chartData.points.length - 1].y}
                r="4"
                fill="rgb(37, 99, 235)"
                stroke="white"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No forecasts yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
