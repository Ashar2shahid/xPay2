"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  ProjectCard,
  LoadingSpinner,
  ProjectCardSkeleton,
  ErrorMessage,
} from "./components";
import { Button } from "./components/ui/button";
import { useStore } from "../store";
import { Plus, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { projects, isLoading, error, loadProjects } = useStore();

  useEffect(() => {
    const loadData = async () => {
      await loadProjects();
    };
    loadData();
  }, [loadProjects]);

  // Handle loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Page Header */}
        <div className="border-b border-border pb-6 md:pb-8 mb-8 md:mb-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-gradient-primary flex items-center justify-center shadow-sm">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Endpoint Dashboard
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                Manage and monitor your blockchain RPC endpoints
              </p>
            </div>
            <Button
              onClick={() => router.push("/create-project")}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Loading Projects...
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Handle error state
  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Page Header */}
        <div className="border-b border-border pb-6 md:pb-8 mb-8 md:mb-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-gradient-primary flex items-center justify-center shadow-sm">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Endpoint Dashboard
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                Manage and monitor your blockchain RPC endpoints
              </p>
            </div>
            <Button
              onClick={() => router.push("/create-project")}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Error message */}
        <ErrorMessage
          error={error}
          title="Failed to load projects"
          showRetry={true}
          onRetry={loadProjects}
          retryText="Reload Projects"
          className="max-w-2xl mx-auto"
        />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Page Header */}
      <div className="border-b border-border pb-6 md:pb-8 mb-8 md:mb-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-gradient-primary flex items-center justify-center shadow-sm">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Endpoint Dashboard
              </h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Manage and monitor your blockchain RPC endpoints
            </p>
          </div>
          <Button
            onClick={() => router.push("/create-project")}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No projects yet"
          description="Create your first project to start managing endpoints"
          action={{
            text: "Create Project",
            onClick: () => router.push("/create-project"),
            icon: <Plus className="h-4 w-4 mr-2" />,
          }}
          className="py-20"
        />
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Your Projects
            </h2>
            <div className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
