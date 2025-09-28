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
    method: "GET" as HTTPMethod,
    headers: "",
    params: "",
    body: "",
    price: 0.01,
    creditsEnabled: false,
    minTopupAmount: 10,
    settleWhen: "before",
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
      // Parse headers and params as JSON objects
      let parsedHeaders: Record<string, string> | undefined;
      let parsedParams: Record<string, any> | undefined;
      let parsedBody: any;

      try {
        parsedHeaders =
          formData.headers && formData.headers.trim()
            ? JSON.parse(formData.headers.trim())
            : undefined;
      } catch {
        toast({
          title: "Invalid Headers",
          description: "Headers must be valid JSON object",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        parsedParams =
          formData.params && formData.params.trim()
            ? JSON.parse(formData.params.trim())
            : undefined;
      } catch {
        toast({
          title: "Invalid Params",
          description: "Params must be valid JSON object",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        parsedBody =
          formData.body && formData.body.trim()
            ? JSON.parse(formData.body.trim())
            : undefined;
      } catch {
        toast({
          title: "Invalid Body",
          description: "Body must be valid JSON",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await addEndpoint(projectId, {
        url: formData.url,
        path: formData.path || formData.url,
        method: formData.method,
        headers: parsedHeaders,
        params: parsedParams,
        body: parsedBody,
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
        method: "GET" as HTTPMethod,
        headers: "",
        params: "",
        body: "",
        price: 0.01,
        creditsEnabled: false,
        minTopupAmount: 10,
        settleWhen: "before",
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

          {/* Method and URL field */}
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
            <div className="flex items-center gap-2">
              <Select
                value={formData.method}
                onValueChange={(value: HTTPMethod) =>
                  setFormData((prev) => ({ ...prev, method: value }))
                }
              >
                <SelectTrigger className="w-24 !h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="url"
                placeholder="https://api.example.com/v1"
                required
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                className="!text-lg !p-4 !h-14 flex-1"
              />
            </div>
          </div>

          {/* Conditional fields based on method */}
          {(formData.method === "GET" || formData.method === "POST") && (
            <div className="space-y-3">
              {/* Headers field */}
              <div className="relative">
                <div className="flex items-center gap-2 absolute -top-1 left-2 bg-background px-1">
                  <label className="text-xs text-muted-foreground">
                    Headers (JSON)
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Headers help"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        HTTP headers as JSON object, e.g.,{" "}
                        {`{"Authorization": "Bearer token"}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  placeholder='{"Content-Type": "application/json"}'
                  value={formData.headers}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headers: e.target.value,
                    }))
                  }
                  className="!text-sm !p-3 !h-10"
                />
              </div>

              {/* Params field */}
              <div className="relative">
                <div className="flex items-center gap-2 absolute -top-1 left-2 bg-background px-1">
                  <label className="text-xs text-muted-foreground">
                    Params (JSON)
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Params help"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Query parameters as JSON object, e.g.,{" "}
                        {`{"limit": 10, "page": 1}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  placeholder='{"limit": 10, "page": 1}'
                  value={formData.params}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, params: e.target.value }))
                  }
                  className="!text-sm !p-3 !h-10"
                />
              </div>

              {/* Body field - only for POST */}
              {formData.method === "POST" && (
                <div className="relative">
                  <div className="flex items-center gap-2 absolute -top-1 left-2 bg-background px-1">
                    <label className="text-xs text-muted-foreground">
                      Body (JSON)
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Body help"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Request body as JSON, e.g.,{" "}
                          {`{"name": "John", "email": "john@example.com"}`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    placeholder='{"name": "John", "email": "john@example.com"}'
                    value={formData.body}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, body: e.target.value }))
                    }
                    className="!text-sm !p-3 !h-10"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer with controls */}
          <div className="flex items-end justify-between pt-2">
            {/* Settlement Response Time */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[10px] text-muted-foreground">
                    Settle Response{" "}
                    <span className="text-primary">
                      {formData.settleWhen === "before" ? "Before" : "After"}
                    </span>
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Settlement timing help"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Choose whether settlement occurs before or after the
                        response.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  checked={formData.settleWhen === "after"}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      settleWhen: checked ? "after" : "before",
                    }))
                  }
                  className="scale-75"
                />
              </div>

              {/* Use Credit */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[10px] text-muted-foreground">
                    Use Credit
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Use credit help"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Enable to deduct credits for each API call.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  checked={formData.creditsEnabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      creditsEnabled: checked,
                    }))
                  }
                  className="scale-75"
                />
              </div>

              {/* Cost per Call */}
              <div className="flex flex-col items-start min-w-[100px]">
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[10px] text-muted-foreground">
                    Price
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Cost per call help"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Cost in credits deducted per API call.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: e.target.value ? parseFloat(e.target.value) : 0.01,
                    }))
                  }
                  className="!text-[10px] !h-6 text-center w-full"
                />
              </div>
            </div>
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
