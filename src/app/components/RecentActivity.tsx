"use client";

import React from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

export interface ErrorItem {
  time: string;
  error: string;
  status: number;
}

export interface ConfigItem {
  label: string;
  value: string;
}

export interface RecentActivityProps {
  recentErrors?: ErrorItem[];
  configuration?: ConfigItem[];
  createdAt?: Date;
  lastRequest?: Date;
  className?: string;
}

export function RecentActivity({
  recentErrors = [],
  configuration = [],
  createdAt,
  lastRequest,
  className = "",
}: RecentActivityProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Recent Errors */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recent Errors
        </h3>
        <div className="space-y-3">
          {recentErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent errors
            </div>
          ) : (
            recentErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/10"
              >
                <div>
                  <div className="font-medium text-foreground">
                    {error.error}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {error.time}
                  </div>
                </div>
                <Badge variant="destructive">{error.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Endpoint Configuration
        </h3>
        <div className="space-y-4">
          {configuration.length > 0 && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {configuration.map((config, index) => (
                <div key={index}>
                  <div className="text-muted-foreground">{config.label}</div>
                  <div className="font-mono text-foreground">
                    {config.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(createdAt || lastRequest) && (
            <div className="pt-4 border-t border-border space-y-4">
              {createdAt && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Created
                  </div>
                  <div className="text-sm text-foreground">
                    {createdAt.toLocaleDateString()} at{" "}
                    {createdAt.toLocaleTimeString()}
                  </div>
                </div>
              )}

              {lastRequest && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Last Request
                  </div>
                  <div className="text-sm text-foreground">
                    {lastRequest.toLocaleDateString()} at{" "}
                    {lastRequest.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Helper function to generate mock error data
export function generateMockErrors(): ErrorItem[] {
  return [
    {
      time: "2 minutes ago",
      error: "Connection timeout",
      status: 408,
    },
    {
      time: "15 minutes ago",
      error: "Rate limit exceeded",
      status: 429,
    },
    {
      time: "1 hour ago",
      error: "Invalid request format",
      status: 400,
    },
  ];
}

// Helper function to generate mock configuration data
export function generateMockConfig(): ConfigItem[] {
  return [
    { label: "Protocol", value: "HTTPS" },
    { label: "Method", value: "POST" },
    { label: "Timeout", value: "30s" },
    { label: "Retries", value: "3" },
  ];
}
