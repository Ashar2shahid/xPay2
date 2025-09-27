"use client";

import React, { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
import { Endpoint } from "@/types";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

export interface EndpointCardProps {
  endpoint: Endpoint;
  onClick?: () => void;
  onDelete?: (endpointId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function EndpointCard({
  endpoint,
  onClick,
  onDelete,
  showActions = true,
  className = "",
}: EndpointCardProps) {
  // Using filler data for stats since API doesn't provide these yet
  const requestCount = 0;
  const avgLatency = 0;
  const successRate = 0;
  const [copied, setCopied] = useState(false);

  const getStatusColor = () => {
    return endpoint.isActive ? "default" : "secondary";
  };

  const getStatusIcon = () => {
    return endpoint.isActive ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <Clock className="h-3 w-3" />
    );
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(endpoint.id);
    }
  };

  const handleCopyProxyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const extractDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      // Fallback for invalid URLs - return the original string
      return url;
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
              {extractDomain(endpoint.url)}
            </h3>
            {endpoint.description && (
              <p className="text-xs text-muted-foreground">
                {endpoint.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showActions && onDelete && (
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
                      Are you sure you want to delete this endpoint? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Badge variant={getStatusColor()}>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                {endpoint.isActive ? "Active" : "Inactive"}
              </div>
            </Badge>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground mb-1">
                Proxy URL
              </div>
              <div
                className="text-xs font-mono text-foreground truncate"
                title={endpoint.proxyUrl}
              >
                {truncateUrl(endpoint.proxyUrl)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyProxyUrl}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
              title={copied ? "Copied!" : "Copy proxy URL"}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          Created: {new Date(endpoint.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
}
