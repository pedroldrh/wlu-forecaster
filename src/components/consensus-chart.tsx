"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, ColorType, AreaSeries } from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";

interface ConsensusChartProps {
  data: { time: string; value: number }[];
}

export function ConsensusChart({ data }: ConsensusChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.35)",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255, 255, 255, 0.04)", style: 1 },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.15, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        horzLine: {
          visible: true,
          style: 3,
          color: "rgba(129, 140, 248, 0.4)",
          labelVisible: true,
          labelBackgroundColor: "rgb(99, 102, 241)",
        },
        vertLine: {
          visible: true,
          style: 3,
          color: "rgba(255, 255, 255, 0.08)",
          labelVisible: true,
        },
      },
      handleScroll: true,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "rgb(129, 140, 248)",
      topColor: "rgba(129, 140, 248, 0.3)",
      bottomColor: "rgba(129, 140, 248, 0.01)",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: "rgb(129, 140, 248)",
      crosshairMarkerBorderColor: "rgb(129, 140, 248)",
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: "rgba(129, 140, 248, 0.35)",
      priceLineStyle: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${Math.round(price)}%`,
        minMove: 1,
      },
      autoscaleInfoProvider: () => ({
        priceRange: { minValue: 0, maxValue: 100 },
      }),
    });

    const chartData = data.map((d) => ({
      time: Math.floor(new Date(d.time).getTime() / 1000),
      value: d.value * 100,
    }));

    series.setData(chartData as any);

    // Update legend on crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (!legendRef.current) return;
      const valueEl = legendRef.current.querySelector("[data-value]");
      const dateEl = legendRef.current.querySelector("[data-date]");
      if (!valueEl || !dateEl) return;

      if (!param.time || !param.seriesData.size) {
        valueEl.textContent = `${Math.round(latestValue * 100)}%`;
        dateEl.textContent = "Latest";
        return;
      }

      const price = param.seriesData.get(series);
      if (price && "value" in price) {
        valueEl.textContent = `${Math.round(price.value)}%`;
        const ts = param.time as number;
        const d = new Date(ts * 1000);
        dateEl.textContent = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    });

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, latestValue]);

  return (
    <Card className="overflow-hidden bg-[#0f1319] border-border/40">
      <CardContent className="p-0">
        {/* Legend overlay */}
        <div ref={legendRef} className="px-5 pt-5 pb-0 relative z-10">
          <p className="text-[11px] uppercase tracking-widest text-white/30 font-medium">
            Community Consensus
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p data-value className="text-4xl font-bold text-white font-mono tabular-nums">
              {data.length > 0 ? `${Math.round(latestValue * 100)}%` : "\u2014"}
            </p>
            <p data-date className="text-xs text-white/30 h-4">
              {data.length > 0 ? "Latest" : ""}
            </p>
          </div>
        </div>
        {data.length > 0 ? (
          <div ref={containerRef} className="-mt-2" />
        ) : (
          <div className="flex items-center justify-center h-[280px] -mt-4 text-white/20 text-sm">
            No forecasts yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
