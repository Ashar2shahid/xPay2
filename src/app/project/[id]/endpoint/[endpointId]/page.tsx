"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { useStore } from "@/store";
import {
  ExternalLink,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  Activity,
} from "lucide-react";
import {
  StatsOverview,
  PerformanceChart,
  RecentActivity,
  ChainSymbol,
  generateHourlyData,
  generateMockErrors,
  generateMockConfig,
} from "@/app/components";

export default function EndpointDetail() {
  const { id, endpointId } = useParams() as { id: string; endpointId: string };
  const router = useRouter();
  const { getProject, getEndpoint } = useStore();

  const project = getProject(id);
  const endpoint = project ? getEndpoint(project.id, endpointId) : null;

  if (!endpoint || !project) {
    return (
      <div className="flex items-center justify-center p-10 md:p-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Endpoint not found
          </h1>
          <Button onClick={() => router.push("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <div className="h-2 w-2 bg-green-500 rounded-full mr-1" />;
      case "error":
        return <div className="h-2 w-2 bg-red-500 rounded-full mr-1" />;
      default:
        return <div className="h-2 w-2 bg-gray-500 rounded-full mr-1" />;
    }
  };

  // Mock hourly data for the last 24 hours
  const hourlyData = generateHourlyData(24);

  // Mock data for components
  const metricsData = [
    {
      title: "Total Requests",
      value: endpoint.requestCount,
      icon: Zap,
      iconColor: "text-primary",
      iconBgColor: "bg-primary/10",
      subtitle: "+1,247 from yesterday",
    },
    {
      title: "Avg Latency",
      value: `${endpoint.avgLatency}ms`,
      icon: Clock,
      iconColor: "text-secondary",
      iconBgColor: "bg-secondary/10",
      subtitle: "-12ms from yesterday",
    },
    {
      title: "Success Rate",
      value: `${endpoint.successRate}%`,
      icon: TrendingUp,
      iconColor: "text-success",
      iconBgColor: "bg-success/10",
      valueClassName: "text-success",
      subtitle: "+0.3% from yesterday",
    },
    {
      title: "Uptime",
      value: "99.9%",
      icon: Activity,
      iconColor: "text-accent",
      iconBgColor: "bg-accent/10",
      subtitle: "30-day average",
    },
  ];

  const recentErrors = generateMockErrors();
  const configData = generateMockConfig();

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
      {/* Endpoint Header */}
      <div className="border-b border-border pb-6 md:pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {endpoint.name}
            </h1>
            <Badge variant={getStatusColor(endpoint.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(endpoint.status)}
                {endpoint.status}
              </div>
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{project.name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              {project.chain.map((chain, index) => (
                <div
                  key={chain.id}
                  className="p-0.5 border border-border rounded bg-background"
                  title={chain.name}
                >
                  <ChainSymbol symbol={chain.symbol} size="xs" />
                </div>
              ))}
            </div>
            <span>•</span>
            <a
              href={endpoint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {endpoint.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <StatsOverview metrics={metricsData} />

      {/* Performance Chart */}
      <PerformanceChart data={hourlyData} />

      {/* Recent Activity */}
      <RecentActivity
        recentErrors={recentErrors}
        configuration={configData}
        createdAt={new Date(endpoint.createdAt)}
        lastRequest={new Date(endpoint.lastRequest)}
      />
    </main>
  );
}
