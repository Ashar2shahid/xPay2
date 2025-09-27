"use client";

import React from "react";
import { Card } from "@/app/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  subtitle,
  className = "",
  valueClassName = "",
  trend,
}: MetricCardProps) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <Card className={`p-4 ${className}`}>
      {Icon ? (
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`h-10 w-10 ${iconBgColor} flex items-center justify-center`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div
              className={`text-2xl font-mono font-semibold text-foreground ${valueClassName}`}
            >
              {formattedValue}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-sm">{title}</span>
          </div>
          <div
            className={`text-2xl font-mono font-semibold text-foreground ${valueClassName}`}
          >
            {formattedValue}
          </div>
        </>
      )}

      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}

      {trend && (
        <div className="text-xs text-muted-foreground">
          <span
            className={trend.isPositive ? "text-success" : "text-destructive"}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}
          </span>
          {" from yesterday"}
        </div>
      )}
    </Card>
  );
}
