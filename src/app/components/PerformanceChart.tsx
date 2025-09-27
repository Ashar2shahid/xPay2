"use client";

import React, { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export interface ChartDataPoint {
  hour: number;
  requests: number;
  latency: number;
  errors: number;
}

export interface PerformanceChartProps {
  data: ChartDataPoint[];
  title?: string;
  timeRanges?: string[];
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
  className?: string;
  height?: number;
}

export function PerformanceChart({
  data,
  title = "Performance Overview",
  timeRanges = ["24h", "7d", "30d"],
  selectedRange = "24h",
  onRangeChange,
  className = "",
  height = 64, // 256px (h-64)
}: PerformanceChartProps) {
  const [activeRange, setActiveRange] = useState(selectedRange);

  const handleRangeClick = (range: string) => {
    setActiveRange(range);
    if (onRangeChange) {
      onRangeChange(range);
    }
  };

  // Find the maximum requests value to normalize the bar heights
  const maxRequests = Math.max(...data.map((d) => d.requests));

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <Badge
              key={range}
              variant={activeRange === range ? "default" : "outline"}
              className="text-xs cursor-pointer"
              onClick={() => handleRangeClick(range)}
            >
              {range}
            </Badge>
          ))}
        </div>
      </div>

      <div className={`h-${height} flex items-end justify-between gap-1`}>
        {data.map((dataPoint, index) => {
          const barHeight = (dataPoint.requests / maxRequests) * (height * 4); // Convert to pixels

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-gradient-primary opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ height: `${barHeight}px` }}
                title={`Hour ${dataPoint.hour}: ${
                  dataPoint.requests
                } requests, ${dataPoint.latency}ms avg${
                  dataPoint.errors ? `, ${dataPoint.errors} errors` : ""
                }`}
              />
              {index % 4 === 0 && (
                <div className="text-xs text-muted-foreground">
                  {dataPoint.hour}:00
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Helper function to generate mock data for 24 hours
export function generateHourlyData(hours: number = 24): ChartDataPoint[] {
  return Array.from({ length: hours }, (_, i) => ({
    hour: i,
    requests: Math.floor(Math.random() * 1000) + 200,
    latency: Math.floor(Math.random() * 100) + 120,
    errors: Math.floor(Math.random() * 10),
  }));
}
