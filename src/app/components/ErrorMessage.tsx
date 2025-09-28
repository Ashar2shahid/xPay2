"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";

export interface ErrorMessageProps {
  error: string | Error;
  title?: string;
  className?: string;
  variant?: "default" | "destructive";
  showRetry?: boolean;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorMessage({
  error,
  title = "Something went wrong",
  className,
  variant = "destructive",
  showRetry = false,
  onRetry,
  retryText = "Try again",
}: ErrorMessageProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const Icon = variant === "destructive" ? AlertCircle : AlertTriangle;

  return (
    <Alert variant={variant} className={cn("", className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{errorMessage}</p>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {retryText}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Specific error components for common scenarios
export function NetworkErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      error="Unable to connect to the server. Please check your internet connection."
      title="Network Error"
      showRetry={!!onRetry}
      onRetry={onRetry}
      retryText="Retry"
    />
  );
}

export function NotFoundErrorMessage({
  itemName = "item",
  onGoBack,
}: {
  itemName?: string;
  onGoBack?: () => void;
}) {
  return (
    <ErrorMessage
      error={`The ${itemName} you're looking for could not be found.`}
      title="Not Found"
      variant="default"
      showRetry={!!onGoBack}
      onRetry={onGoBack}
      retryText="Go Back"
    />
  );
}

export function ApiErrorMessage({
  error,
  onRetry,
}: {
  error: string | Error;
  onRetry?: () => void;
}) {
  return (
    <ErrorMessage
      error={error}
      title="API Error"
      showRetry={!!onRetry}
      onRetry={onRetry}
      retryText="Retry Request"
    />
  );
}
