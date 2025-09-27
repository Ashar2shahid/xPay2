"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/app/components/ui/tooltip";
import { Info, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { toast } from "@/hooks/use-toast";
import { HTTPMethod } from "@/types";

export interface AddEndpointProps {
  projectId: string;
  onSuccess?: () => void;
  className?: string;
}

const derivePathFromUrl = (url?: string): string => {
  if (!url) return "";
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

export function AddEndpoint({
  projectId,
  onSuccess,
  className,
}: AddEndpointProps) {
  const addEndpoint = useStore((state) => state.addEndpoint);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    url: "",
    path: "",
    description: "",
    price: 0.01,
    creditsEnabled: false,
    minTopupAmount: 10,
  });

  // Auto-generate path from URL if path is empty
  React.useEffect(() => {
    if (!formData.url) return;
    if (formData.path && formData.path.trim().length > 0) return;
    const path = derivePathFromUrl(formData.url);
    if (path) {
      setFormData((prev) => ({ ...prev, path }));
    }
  }, [formData.url, formData.path]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addEndpoint(projectId, {
        url: formData.url,
        path: formData.path || formData.url,

        description: formData.description || undefined,
        price: formData.price > 0 ? formData.price : undefined,
        creditsEnabled: formData.creditsEnabled,
        minTopupAmount: formData.minTopupAmount,
      });

      toast({
        title: "Endpoint Added",
        description: `Successfully added ${formData.url}`,
      });

      // Reset form
      setFormData({
        url: "",
        path: "",
        description: "",
        price: 0.01,
        creditsEnabled: false,
        minTopupAmount: 10,
      });

      // Call success callback
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add endpoint:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add endpoint",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Header row with path and description */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Path (e.g., /api/v1/users)"
                value={formData.path}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, path: e.target.value }))
                }
                className="!text-[10px] bg-transparent border-0 !h-4 outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
              />
            </div>

            <div className="flex-1">
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="!text-[10px] bg-transparent border-0 !h-4 outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
              />
            </div>
          </div>

          {/* URL field */}
          <div className="relative">
            <div className="flex items-center gap-2 absolute -top-1 left-2 bg-background px-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="URL help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Publicly reachable endpoint URL.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="url"
              placeholder="https://api.example.com/v1"
              required
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              className="!text-lg !p-4 !h-14"
            />
          </div>

          {/* Footer with controls */}
          <div className="flex items-end justify-between pt-2">
            {/* Submit button */}
            <div className="flex items-end">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddEndpoint;
