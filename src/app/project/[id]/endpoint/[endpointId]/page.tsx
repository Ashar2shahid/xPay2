"use client";

import { useEffect, useState } from "react";
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
  Copy,
  Check,
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
        <h3 className="text-lg font-semibold mb-2">Configuration</h3>
        <p className="text-muted-foreground text-sm">
          No headers, parameters, or body configuration set for this endpoint.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Configuration</h3>
      <div className="space-y-4">
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
      title: "Endpoint URL",
      value: endpoint.url,
      icon: Zap,
      iconColor: "text-primary",
      iconBgColor: "bg-primary/10",
      subtitle: `${endpoint.method} request`,
    },
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
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
      {/* Endpoint Header */}
      <div className="border-b border-border pb-6 md:pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {endpoint.url}
            </h1>
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
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{project.name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              {project.paymentChains.map((chainId, index) => (
                <ChainSymbol key={index} symbol={chainId} />
              ))}
            </div>
            <span>•</span>
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

        {/* Proxy URL Section */}

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Proxy URL
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyProxyUrl}
                className="h-8 gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-background rounded-md border">
              <code className="text-sm font-mono text-foreground break-all">
                {endpoint.proxyUrl}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL to make requests through the xPay proxy
            </p>
          </div>
        </Card>
      </div>

      {/* Key Metrics */}
      <StatsOverview metrics={metricsData} />

      {/* Endpoint Configuration */}
      <EndpointConfiguration endpoint={endpoint} />

      {/* Performance Chart */}
      <PerformanceChart data={hourlyData} />

      {/* Recent Activity */}
      <RecentActivity
        recentErrors={recentErrors}
        configuration={configData}
        createdAt={new Date(endpoint.createdAt)}
        lastRequest={new Date()} // Using current date as fallback since lastRequest doesn't exist in new schema
      />
    </main>
  );
}
