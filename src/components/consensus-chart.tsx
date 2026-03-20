"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, ColorType, AreaSeries, type UTCTimestamp } from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendUp, TrendDown } from "@phosphor-icons/react";

interface ConsensusChartProps {
  data: { time: string; value: number }[];
  userProbability?: number | null;
}

export function ConsensusChart({ data, userProbability = null }: ConsensusChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const latestTimestamp = data.length > 0 ? new Date(data[data.length - 1].time).getTime() : 0;
  const oneDayAgo = latestTimestamp - 24 * 60 * 60 * 1000;
  const value24hAgo = [...data].reverse().find((d) => new Date(d.time).getTime() <= oneDayAgo)?.value ?? data[0]?.value ?? latestValue;
  const delta24h = latestValue - value24hAgo;

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Delay chart init slightly so mobile PWA containers have layout dimensions
    const initTimer = setTimeout(() => {
      if (!containerRef.current) return;
      initChart();
    }, 50);

    function initChart() {
    const container = containerRef.current!;
    const isMobile = container.clientWidth < 640;
    const chartHeight = isMobile ? 220 : 280;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      autoSize: false,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(100, 116, 139, 0.85)",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(148, 163, 184, 0.18)", style: 1 },
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
          color: "rgba(59, 130, 246, 0.35)",
          labelVisible: true,
          labelBackgroundColor: "rgb(37, 99, 235)",
        },
        vertLine: {
          visible: true,
          style: 3,
          color: "rgba(100, 116, 139, 0.2)",
          labelVisible: true,
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "rgb(37, 99, 235)",
      topColor: "rgba(37, 99, 235, 0.24)",
      bottomColor: "rgba(37, 99, 235, 0.02)",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: "rgb(37, 99, 235)",
      crosshairMarkerBorderColor: "rgb(37, 99, 235)",
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: "rgba(37, 99, 235, 0.35)",
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
      time: Math.floor(new Date(d.time).getTime() / 1000) as UTCTimestamp,
      value: d.value * 100,
    }));

    series.setData(chartData);

    if (userProbability !== null && userProbability !== undefined) {
      series.createPriceLine({
        price: userProbability * 100,
        color: "rgba(16, 185, 129, 0.9)",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Your forecast",
      });
    }

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
    resizeObserver.observe(container);

    cleanupRef.current = () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
    } // end initChart

    return () => {
      clearTimeout(initTimer);
      cleanupRef.current?.();
    };
  }, [data, latestValue, userProbability]);

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        {/* Legend overlay */}
        <div ref={legendRef} className="px-5 pt-5 pb-0 relative z-10">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Community Consensus
          </p>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mt-1">
            <p data-value className="text-4xl font-bold text-foreground font-mono tabular-nums">
              {data.length > 0 ? `${Math.round(latestValue * 100)}%` : "\u2014"}
            </p>
            <p data-date className="text-xs text-muted-foreground h-4">
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
        {data.length > 0 ? (
          <div ref={containerRef} className="-mt-2 h-[220px] sm:h-[280px] w-full" />
        ) : (
          <div className="flex items-center justify-center h-[280px] -mt-4 text-muted-foreground text-sm">
            No forecasts yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
