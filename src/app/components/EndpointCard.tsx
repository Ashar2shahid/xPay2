"use client";

import React, { useState } from "react";
import { Card } from "@/app/components/ui/card";
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
  Maximize2,
  X,
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

  const getStatusIcon = () => {};

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
      className={`cursor-pointer transition-all hover:bg-card-hover shadow-lg group rounded-xl overflow-hidden grid ${className}`}
      onClick={handleCardClick}
    >
      {/* Window Bar Header */}
      <div className="flex items-center justify-between p-2 bg-muted/30 border border-base-500">
        {/* Left: Title */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors font-display truncate">
            {extractDomain(endpoint.url)}
          </h3>
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500">
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
          </button>
          {showActions && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
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
        </div>
      </div>

      {/* Address Bar */}
      <div className="flex items-center justify-between p-2 bg-white border border-base-500 border-t-0">
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

      {/* Large Active Badge - Main Content */}
      <div
        className={`flex items-center justify-center w-full h-full min-h-[100px] text-white ${
          endpoint.isActive ? "bg-green-500" : "bg-gray-500"
        }`}
      >
        <div className="flex items-center gap-2 text-5xl font-semibold relative">
          {endpoint.isActive ? (
            <TrendingUp className="absolute inset-0 left-1/2 top-1/2 -translate-y-1/2 -translate-1/2 opacity-70 text-base-800" />
          ) : (
            <Clock className="absolute inset-0 left-1/2 top-1/2 -translate-y-1/2 -translate-1/2 opacity-70 text-base-800" />
          )}

          <span className="text-primary-300 relative z-10">
            {endpoint.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-1 border border-base-500">
        <div className="text-xs text-muted-foreground">
          Created: {new Date(endpoint.createdAt).toLocaleDateString()}
        </div>
        {endpoint.description && (
          <div
            className="text-xs text-muted-foreground truncate max-w-[200px]"
            title={endpoint.description}
          >
            {endpoint.description}
          </div>
        )}
      </div>
    </Card>
  );
}
