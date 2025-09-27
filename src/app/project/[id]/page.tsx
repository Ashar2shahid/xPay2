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
  Edit,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AddEndpoint } from "@/app/components/AddEndpoint";
import {
  StatsOverview,
  EndpointList,
  EditEndpointDialog,
  ChainSymbol,
} from "@/app/components";

export default function ProjectDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { getProject, addEndpoint, updateEndpoint, deleteEndpoint } =
    useStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);

  const project = getProject(id);
  const endpoints = project?.endpoints || [];

  useEffect(() => {
    if (!project) {
      router.push("/not-found");
    }
  }, [project, router]);

  if (!project) {
    return null;
  }

  const handleEndpointAdded = () => {
    // Refresh can happen automatically since we're using the store
    // The component will re-render when the store updates
  };

  const handleEditEndpoint = (
    endpointId: string,
    updates: { name: string; url: string; description?: string }
  ) => {
    updateEndpoint(id, endpointId, updates);

    toast({
      title: "Endpoint Updated",
      description: `Endpoint ${updates.name} has been updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingEndpoint(null);
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    deleteEndpoint(id, endpointId);
    toast({
      title: "Endpoint Deleted",
      description: "The endpoint has been removed.",
    });
  };

  const openEditDialog = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setIsEditDialogOpen(true);
  };

  // Prepare metrics data for StatsOverview
  const metrics = [
    {
      title: "Total Requests",
      value: project.totalRequests,
      icon: Zap,
      iconColor: "text-muted-foreground",
    },
    {
      title: "Avg Latency",
      value: `${project.avgLatency}ms`,
      icon: Clock,
      iconColor: "text-muted-foreground",
    },
    {
      title: "Success Rate",
      value: `${project.successRate}%`,
      icon: TrendingUp,
      iconColor: "text-muted-foreground",
      valueClassName: "text-success",
    },
    {
      title: "Active Endpoints",
      value: endpoints.filter((ep) => ep.status === "active").length,
      icon: ExternalLink,
      iconColor: "text-muted-foreground",
    },
  ];

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
              {project.chain.map((chain, index) => (
                <div
                  key={chain.id}
                  className="p-1 border border-border rounded bg-background"
                  title={chain.name}
                >
                  <ChainSymbol symbol={chain.symbol} size="xs" />
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {project.description}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview metrics={metrics} columns={{ default: 4, md: 4, lg: 4 }} />

      {/* Add Endpoint Section */}
      <div className="max-w-2xl mx-auto">
        <AddEndpoint projectId={id} onSuccess={handleEndpointAdded} />

        {/* Edit Endpoint Dialog */}
        <EditEndpointDialog
          endpoint={editingEndpoint}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingEndpoint(null);
          }}
          onSave={handleEditEndpoint}
        />
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
                        {endpoint.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {endpoint.url}
                      </p>
                      {endpoint.description && (
                        <p className="text-xs text-muted-foreground">
                          {endpoint.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(endpoint);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
                              Are you sure you want to delete &quot;
                              {endpoint.name}&quot;? This action cannot be
                              undone.
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
                        variant={
                          endpoint.status === "active"
                            ? "default"
                            : endpoint.status === "error"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        <div className="flex items-center gap-1">
                          {endpoint.status === "active" && (
                            <TrendingUp className="h-3 w-3" />
                          )}
                          {endpoint.status === "error" && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {endpoint.status === "inactive" && (
                            <Clock className="h-3 w-3" />
                          )}
                          {endpoint.status}
                        </div>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Requests</div>
                      <div className="font-mono text-foreground">
                        {endpoint.requestCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Latency</div>
                      <div className="font-mono text-foreground">
                        {endpoint.avgLatency}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Success</div>
                      <div className="font-mono text-foreground">
                        {endpoint.successRate}%
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border pt-4">
                    Last request:{" "}
                    {new Date(endpoint.lastRequest).toLocaleDateString()} at{" "}
                    {new Date(endpoint.lastRequest).toLocaleTimeString()}
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
