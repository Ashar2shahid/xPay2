"use client";

import React from "react";
import { MetricCard, MetricCardProps } from "./MetricCard";

export interface StatsOverviewProps {
  metrics: MetricCardProps[];
  className?: string;
  columns?: {
    default?: number;
    md?: number;
    lg?: number;
  };
}

export function StatsOverview({
  metrics,
  className = "",
  columns = {
    default: 1,
    md: 2,
    lg: 4,
  },
}: StatsOverviewProps) {
  const gridClasses = `grid gap-6 grid-cols-2 md:grid-cols-2`;

  return (
    <div className={`${gridClasses} ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
