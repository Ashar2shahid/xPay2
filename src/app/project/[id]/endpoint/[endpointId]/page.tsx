"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  Activity,
  Copy,
  Check,
  X,
  Maximize2,
} from "lucide-react";

import {
  StatsOverview,
  PerformanceChart,
  RecentActivity,
  ChainSymbol,
  generateHourlyData,
  generateMockErrors,
  generateMockConfig,
  LoadingSpinner,
  StatsOverviewSkeleton,
  ErrorMessage,
  NotFoundErrorMessage,
} from "@/app/components";

// Component to display endpoint configuration (headers, body, params)
function EndpointConfiguration({ endpoint }: { endpoint: any }) {
  const parseJsonField = (field: string | null | undefined) => {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch {
      return field; // Return as string if parsing fails
    }
  };

  const formatJson = (obj: any) => {
    if (obj === null || obj === undefined) return null;
    return JSON.stringify(obj, null, 2);
  };

  const headers = parseJsonField(endpoint.headers);
  const body = parseJsonField(endpoint.body);
  const params = parseJsonField(endpoint.params);

  const hasAnyConfig = headers || body || params;

  if (!hasAnyConfig) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2 font-display">
          Configuration
        </h3>
        <p className="text-muted-foreground text-sm">
          No headers, parameters, or body configuration set for this endpoint.
        </p>
      </Card>
    );
  }

  // Count how many sections exist to determine grid columns
  const existingSections = [headers, params, body].filter(Boolean).length;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 font-display">Configuration</h3>
      <div
        className={cn(
          "grid gap-4",
          existingSections === 1 && "grid-cols-1",
          existingSections === 2 && "grid-cols-2",
          existingSections === 3 && "grid-cols-3"
        )}
      >
        {headers && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Headers
            </h4>
            <div className="bg-muted/50 rounded-md p-3 border">
              <pre className="text-xs font-mono text-foreground overflow-x-auto">
                {formatJson(headers)}
              </pre>
            </div>
          </div>
        )}

        {params && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Parameters
            </h4>
            <div className="bg-muted/50 rounded-md p-3 border">
              <pre className="text-xs font-mono text-foreground overflow-x-auto">
                {formatJson(params)}
              </pre>
            </div>
          </div>
        )}

        {body && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Request Body
            </h4>
            <div className="bg-muted/50 rounded-md p-3 border">
              <pre className="text-xs font-mono text-foreground overflow-x-auto">
                {formatJson(body)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function EndpointDetail() {
  const { id, endpointId } = useParams() as { id: string; endpointId: string };
  const router = useRouter();
  const { getProject, getEndpoint, loadProject, isLoading, error } = useStore();
  const [copied, setCopied] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const project = hasMounted ? getProject(id) : null;
  const endpoint = project ? getEndpoint(project.id, endpointId) : null;

  const extractDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      // Fallback for invalid URLs - return the original string
      return url;
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const loadData = async () => {
        await loadProject(id);
      };
      loadData();
    }
  }, [id, loadProject, hasMounted]);

  // Prevent hydration mismatch - show loading until mounted
  if (!hasMounted) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
        {/* Endpoint Header Skeleton */}
        <div className="border-b border-border pb-6 md:pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Stats Overview Skeleton */}
        <StatsOverviewSkeleton />

        {/* Loading message */}
        <LoadingSpinner text="Loading endpoint details..." className="py-12" />
      </main>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
        {/* Endpoint Header Skeleton */}
        <div className="border-b border-border pb-6 md:pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Stats Overview Skeleton */}
        <StatsOverviewSkeleton />

        {/* Loading message */}
        <LoadingSpinner text="Loading endpoint details..." className="py-12" />
      </main>
    );
  }

  // Handle error state
  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <ErrorMessage
          error={error}
          title="Failed to load endpoint"
          showRetry={true}
          onRetry={() => loadProject(id)}
          retryText="Reload Endpoint"
          className="max-w-2xl mx-auto mt-20"
        />
      </main>
    );
  }

  // Handle endpoint not found (after loading is complete)
  if (!isLoading && (!project || !endpoint)) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <NotFoundErrorMessage
          itemName="endpoint"
          onGoBack={() => router.push(`/project/${id}`)}
        />
      </main>
    );
  }

  // If we're still loading or don't have data yet, don't render the main content
  if (!project || !endpoint) {
    return null;
  }

  // Mock hourly data for the last 24 hours
  const hourlyData = generateHourlyData(24);

  const handleCopyProxyUrl = async () => {
    if (endpoint.proxyUrl) {
      try {
        await navigator.clipboard.writeText(endpoint.proxyUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy proxy URL:", err);
      }
    }
  };

  // Mock data for components with actual endpoint data where available
  const metricsData = [
    {
      title: "Price",
      value: endpoint.price ? `$${endpoint.price}` : "Free",
      icon: Clock,
      iconColor: "text-secondary",
      iconBgColor: "bg-secondary/10",
      subtitle: endpoint.creditsEnabled
        ? "Credits enabled"
        : "Credits disabled",
    },
    {
      title: "Status",
      value: endpoint.isActive ? "Active" : "Inactive",
      icon: TrendingUp,
      iconColor: endpoint.isActive ? "text-success" : "text-muted-foreground",
      iconBgColor: endpoint.isActive ? "bg-success/10" : "bg-muted/10",
      valueClassName: endpoint.isActive
        ? "text-success"
        : "text-muted-foreground",
      subtitle: endpoint.isActive
        ? "Endpoint is active"
        : "Endpoint is inactive",
    },
    {
      title: "Min Topup",
      value: `$${endpoint.minTopupAmount}`,
      icon: Activity,
      iconColor: "text-accent",
      iconBgColor: "bg-accent/10",
      subtitle: "Minimum topup amount",
    },
  ];

  const recentErrors = generateMockErrors();
  const configData = generateMockConfig();

  return (
    <div className="border-5 border-base-600/50 min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Outer Window Container (Project Level) */}
        <div className="rounded-xl overflow-hidden shadow-lg border border-base-500">
          {/* Project Window Bar Header */}
          <div className="flex items-center justify-between p-2 bg-muted border-b border-base-500 fixed top-0 left-0 right-0">
            {/* Left: Chain Icons */}
            <div className="flex items-center gap-1">
              {project.paymentChains.map((chainId, index) => (
                <ChainSymbol key={index} symbol={chainId} />
              ))}
            </div>

            {/* Center: Project Description */}
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground truncate px-2">
                {project.name || "No name provided"}
              </p>
            </div>

            {/* Right: Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push("/")}
                className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Inner Window Container (Endpoint Level) - Smaller, Stacked */}
          <div className="bg-background border-3 border-base-600 min-h-screen shadow-xl">
            <div className="">
              {/* Endpoint Window Bar Header */}
              <div className="flex items-center justify-between p-2 bg-muted/30 border-b border-base-500">
                {/* Left: Chain Icons */}
                <div className="flex items-center gap-1">
                  {project.paymentChains.map((chainId, index) => (
                    <ChainSymbol key={index} symbol={chainId} />
                  ))}
                </div>

                {/* Center: Endpoint URL */}
                <div className="flex-1 text-center">
                  <p className="text-sm font-semibold text-foreground truncate px-2">
                    {endpoint.url}
                  </p>
                </div>

                {/* Right: Control Buttons */}
                <div className="flex items-center gap-1">
                  <button className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500">
                    <Maximize2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => router.push(`/project/${id}`)}
                    className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Address Bar */}
              <div className="flex items-center justify-between p-2 bg-white border-b border-base-500">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-mono text-foreground truncate"
                    title={endpoint.proxyUrl}
                  >
                    {endpoint.proxyUrl}
                  </div>
                </div>
                <button
                  onClick={handleCopyProxyUrl}
                  className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500 ml-2"
                  title={copied ? "Copied!" : "Copy proxy URL"}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Window Content */}
              <div className="p-6 space-y-8 bg-background">
                {/* Endpoint Title */}
                <div className="text-center border-b border-border pb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-display">
                    {extractDomain(endpoint.url)}
                  </h1>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
                    <span>{project.name}</span>
                    <a
                      href={endpoint.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {endpoint.method} {endpoint.path}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Key Metrics */}
                <StatsOverview metrics={metricsData} />

                {/* Endpoint Configuration */}
                <EndpointConfiguration endpoint={endpoint} />

                {/* Recent Errors Only */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 font-display">
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
              </div>

              {/* Footer with Active Badge and Configuration */}
              <div className="flex items-center justify-between p-2 border-t border-base-500 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge variant={endpoint.isActive ? "default" : "secondary"}>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full mr-1 ${
                          endpoint.isActive ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      {endpoint.isActive ? "Active" : "Inactive"}
                    </div>
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(endpoint.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Configuration Data */}
                <div className="flex items-center gap-4 text-xs">
                  {configData.map((config, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {config.label}:
                      </span>
                      <span className="font-mono text-foreground">
                        {config.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
