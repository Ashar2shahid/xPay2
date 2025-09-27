"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { useStore } from "@/store";
import { toast } from "@/hooks/use-toast";
import { AddEndpoint } from "@/app/components/AddEndpoint";
import { ChainSymbol } from "@/app/components/ChainSymbol";

import {
  EndpointList,
  LoadingSpinner,
  StatsOverviewSkeleton,
  ErrorMessage,
  NotFoundErrorMessage,
} from "@/app/components";

export default function ProjectDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  const {
    getProject,
    addEndpoint,
    deleteEndpoint,
    loadProject,
    isLoading,
    error,
  } = useStore();

  const project = hasMounted ? getProject(id) : null;
  const endpoints = project?.endpoints || [];

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
        {/* Project Header Skeleton */}
        <div className="border-b border-border pb-6 md:pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Stats Overview Skeleton */}
        <StatsOverviewSkeleton />

        {/* Loading message */}
        <LoadingSpinner text="Loading project details..." className="py-12" />
      </main>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
        {/* Project Header Skeleton */}
        <div className="border-b border-border pb-6 md:pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="flex items-center gap-1">
                <div className="h-6 w-6 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Stats Overview Skeleton */}
        <StatsOverviewSkeleton />

        {/* Loading message */}
        <LoadingSpinner text="Loading project details..." className="py-12" />
      </main>
    );
  }

  // Handle error state
  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <ErrorMessage
          error={error}
          title="Failed to load project"
          showRetry={true}
          onRetry={() => loadProject(id)}
          retryText="Reload Project"
          className="max-w-2xl mx-auto mt-20"
        />
      </main>
    );
  }

  // Handle project not found (after loading is complete)
  if (!isLoading && !project) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <NotFoundErrorMessage
          itemName="project"
          onGoBack={() => router.push("/")}
        />
      </main>
    );
  }

  // If we're still loading or don't have a project yet, don't render the main content
  if (!project) {
    return null;
  }

  const handleEndpointAdded = () => {
    // Refresh can happen automatically since we're using the store
    // The component will re-render when the store updates
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    deleteEndpoint(id, endpointId);
    toast({
      title: "Endpoint Deleted",
      description: "The endpoint has been removed.",
    });
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
      {/* Project Header */}
      <div className="border-b border-border pb-6 md:pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {project.name}
            </h1>
            <div className="flex items-center gap-1">
              {project.paymentChains.map((chainId, index) => (
                <ChainSymbol key={index} symbol={chainId} />
              ))}
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {project.description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Add Endpoint Section */}
      <div className="max-w-2xl mx-auto">
        <AddEndpoint projectId={id} onSuccess={handleEndpointAdded} />
      </div>

      {/* Endpoints List */}
      <EndpointList
        endpoints={endpoints}
        title="Project Endpoints"
        onEndpointClick={(endpoint) =>
          router.push(`/project/${id}/endpoint/${endpoint.id}`)
        }
        onEndpointDelete={handleDeleteEndpoint}
        emptyState={{
          title: "No endpoints yet",
          description: "Add your first endpoint using the form above",
        }}
      />
    </main>
  );
}
