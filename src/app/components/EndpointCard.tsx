"use client";

import React from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Endpoint } from "@/types";
import { TrendingUp, AlertCircle, Clock, Edit, Trash2 } from "lucide-react";

export interface EndpointCardProps {
  endpoint: Endpoint;
  onClick?: () => void;
  onEdit?: (endpoint: Endpoint) => void;
  onDelete?: (endpointId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function EndpointCard({
  endpoint,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
  className = "",
}: EndpointCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <TrendingUp className="h-3 w-3" />;
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(endpoint);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(endpoint.id);
    }
  };

  return (
    <Card
      className={`p-6 cursor-pointer hover:bg-card-hover transition-colors group ${className}`}
      onClick={handleCardClick}
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
            {showActions && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {showActions && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Badge variant={getStatusColor(endpoint.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(endpoint.status)}
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
            <div
              className={`font-mono text-${getStatusColor(endpoint.status)}`}
            >
              {endpoint.successRate}%
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          Last request: {new Date(endpoint.lastRequest).toLocaleDateString()} at{" "}
          {new Date(endpoint.lastRequest).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
}
