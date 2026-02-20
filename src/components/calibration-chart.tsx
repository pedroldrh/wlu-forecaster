"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CalibrationChartProps {
  forecasts: { probability: number; outcome: boolean }[];
}

export function CalibrationChart({ forecasts }: CalibrationChartProps) {
  if (forecasts.length < 5) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Need at least 5 resolved forecasts for calibration chart.
      </p>
    );
  }

  // Bucket forecasts into 10% bins
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}-${(i + 1) * 10}%`,
    predicted: (i * 10 + 5) / 100,
    actual: 0,
    count: 0,
    totalOutcome: 0,
  }));

  for (const f of forecasts) {
    const idx = Math.min(Math.floor(f.probability * 10), 9);
    buckets[idx].count++;
    if (f.outcome) buckets[idx].totalOutcome++;
  }

  const data = buckets
    .filter((b) => b.count > 0)
    .map((b) => ({
      name: b.label,
      predicted: Math.round(b.predicted * 100),
      actual: Math.round((b.totalOutcome / b.count) * 100),
      count: b.count,
    }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" />
          <YAxis domain={[0, 100]} className="text-xs" />
          <Tooltip
            formatter={(value, name) => [
              `${value}%`,
              name === "actual" ? "Actual outcome rate" : "Predicted",
            ]}
          />
          <ReferenceLine
            segment={[
              { x: data[0]?.name, y: data[0]?.predicted },
              { x: data[data.length - 1]?.name, y: data[data.length - 1]?.predicted },
            ]}
            stroke="#999"
            strokeDasharray="3 3"
            label="Perfect"
          />
          <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
