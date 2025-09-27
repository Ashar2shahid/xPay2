"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
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

export interface AddEndpointProps {
  projectId: string;
  onSuccess?: () => void;
  className?: string;
}

const deriveHostname = (value?: string): string => {
  if (!value) return "";
  try {
    return new URL(value).hostname;
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

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    settleWhen: "before" as "before" | "after",
    useCredit: false,
    costPerCall: 0.01,
  });

  // Auto-generate name from URL hostname if name is empty
  React.useEffect(() => {
    if (!formData.url) return;
    if (formData.name && formData.name.trim().length > 0) return;
    const host = deriveHostname(formData.url);
    if (host) {
      setFormData((prev) => ({ ...prev, name: host }));
    }
  }, [formData.url, formData.name]);

  const handleSubmit = (e: React.FormEvent) => {
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

    try {
      addEndpoint(projectId, {
        name: formData.name || undefined,
        url: formData.url,
        description: formData.description || undefined,
        settleWhen: formData.settleWhen,
        useCredit: formData.useCredit,
        costPerCall: formData.costPerCall,
      });

      toast({
        title: "Endpoint Added",
        description: `Successfully added ${
          formData.name || deriveHostname(formData.url)
        }`,
      });

      // Reset form
      setFormData({
        name: "",
        url: "",
        description: "",
        settleWhen: "before",
        useCredit: false,
        costPerCall: 0.01,
      });

      // Call success callback
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add endpoint",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Header row with name and description */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
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
                  checked={formData.useCredit}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, useCredit: checked }))
                  }
                  className="scale-75"
                />
              </div>

              {/* Cost per Call */}
              <div className="flex flex-col items-start min-w-[100px]">
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-[10px] text-muted-foreground">
                    Cost per Call
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
                  value={formData.costPerCall}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      costPerCall: e.target.value
                        ? parseFloat(e.target.value)
                        : 0.01,
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
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddEndpoint;
