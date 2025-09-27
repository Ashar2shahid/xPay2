"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { useStore } from "@/store";
import { Endpoint } from "@/types";
import {
  Send,
  ExternalLink,
  Clock,
  Zap,
  TrendingUp,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AddEndpoint } from "@/app/components/AddEndpoint";
import { ProjectDetails } from "@/app/components/ProjectDetails";
import {
  StatsOverview,
  EndpointList,
  ChainSymbol,
  LoadingSpinner,
  StatsOverviewSkeleton,
  ErrorMessage,
  NotFoundErrorMessage,
} from "@/app/components";

export default function ProjectDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const {
    getProject,
    addEndpoint,
    deleteEndpoint,
    loadProject,
    isLoading,
    error,
  } = useStore();

  const project = getProject(id);
  const endpoints = project?.endpoints || [];

  useEffect(() => {
    const loadData = async () => {
      await loadProject(id);
    };
    loadData();
  }, [id, loadProject]);

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
                <div
                  key={chainId}
                  className="p-1 border border-border rounded bg-background"
                  title={chainId}
                >
                  <Badge variant="outline" className="text-xs">
                    {chainId}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {project.description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Project Details Component */}
      <ProjectDetails project={project} />

      {/* Add Endpoint Section */}
      <div className="max-w-2xl mx-auto">
        <AddEndpoint projectId={id} onSuccess={handleEndpointAdded} />
      </div>

      {/* Endpoints List with Custom Delete Handling */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            Project Endpoints
          </h2>
          <div className="text-sm text-muted-foreground">
            {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
          </div>
        </div>

        {endpoints.length === 0 ? (
          <div className="flex items-center justify-center p-10 md:p-12 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <div>
              <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No endpoints yet
              </h3>
              <p className="text-muted-foreground">
                Add your first endpoint using the form above
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="p-6 md:p-7 border border-border rounded-xl cursor-pointer hover:bg-card-hover transition-all hover:shadow-sm group"
                onClick={() =>
                  router.push(`/project/${id}/endpoint/${endpoint.id}`)
                }
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {endpoint.url}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {endpoint.method} {endpoint.path}
                      </p>
                      {endpoint.description && (
                        <p className="text-xs text-muted-foreground">
                          {endpoint.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Endpoint</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this endpoint?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEndpoint(endpoint.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Badge
                        variant={endpoint.isActive ? "default" : "secondary"}
                      >
                        <div className="flex items-center gap-1">
                          {endpoint.isActive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {endpoint.isActive ? "Active" : "Inactive"}
                        </div>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-mono text-foreground">
                        {endpoint.price ? `$${endpoint.price}` : "Free"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Credits</div>
                      <div className="font-mono text-foreground">
                        {endpoint.creditsEnabled ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border pt-4">
                    Created: {new Date(endpoint.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
