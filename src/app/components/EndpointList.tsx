"use client";

import React from "react";
import { Endpoint } from "@/types";
import { EndpointCard } from "./EndpointCard";
import { EmptyState } from "./EmptyState";
import { ExternalLink, Plus } from "lucide-react";

export interface EndpointListProps {
  endpoints: Endpoint[];
  title?: string;
  onEndpointClick?: (endpoint: Endpoint) => void;
  onEndpointDelete?: (endpointId: string) => void;
  onCreateEndpoint?: () => void;
  showActions?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
    actionText?: string;
  };
  className?: string;
}

export function EndpointList({
  endpoints,
  title = "Project Endpoints",
  onEndpointClick,
  onEndpointDelete,
  onCreateEndpoint,
  showActions = true,
  emptyState = {
    title: "No endpoints yet",
    description: "Add your first endpoint using the form above",
    actionText: "Create Endpoint",
  },
  className = "",
}: EndpointListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="text-sm text-muted-foreground">
          {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Content */}
      {endpoints.length === 0 ? (
        <EmptyState
          icon={ExternalLink}
          title={emptyState.title!}
          description={emptyState.description!}
          action={
            onCreateEndpoint
              ? {
                  text: emptyState.actionText!,
                  onClick: onCreateEndpoint,
                  icon: <Plus className="h-4 w-4 mr-2" />,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {endpoints
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((endpoint) => (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                onClick={() => onEndpointClick?.(endpoint)}
                onDelete={onEndpointDelete}
                showActions={showActions}
              />
            ))}
        </div>
      )}
    </div>
  );
}
