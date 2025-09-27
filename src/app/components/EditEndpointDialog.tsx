"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Endpoint } from "@/types";
import { Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface EditEndpointDialogProps {
  endpoint: Endpoint | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    endpointId: string,
    updates: {
      name: string;
      url: string;
      description?: string;
      useCredit?: boolean;
      costPerCall?: number;
    }
  ) => void;
}

interface FormData {
  name: string;
  url: string;
  description: string;
  useCredit: boolean;
  costPerCall: number | undefined;
}

export function EditEndpointDialog({
  endpoint,
  isOpen,
  onClose,
  onSave,
}: EditEndpointDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    url: "",
    description: "",
    useCredit: false,
    costPerCall: undefined,
  });

  // Update form data when endpoint changes
  useEffect(() => {
    if (endpoint) {
      setFormData({
        name: endpoint.name,
        url: endpoint.url,
        description: endpoint.description || "",
        useCredit: endpoint.useCredit || false,
        costPerCall: endpoint.costPerCall,
      });
    }
  }, [endpoint]);

  const handleSave = () => {
    if (!endpoint) return;

    // Validation
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter name and URL",
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

    // Call the save handler
    onSave(endpoint.id, {
      name: formData.name,
      url: formData.url,
      description: formData.description || undefined,
      useCredit: formData.useCredit,
      costPerCall: formData.costPerCall,
    });

    // Reset form and close
    setFormData({
      name: "",
      url: "",
      description: "",
      useCredit: false,
      costPerCall: undefined,
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      url: "",
      description: "",
      useCredit: false,
      costPerCall: undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Endpoint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Name *
            </label>
            <Input
              placeholder="My RPC Endpoint"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              URL *
            </label>
            <Input
              placeholder="https://your-rpc-endpoint.com"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <Textarea
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">
                Use Credit
              </label>
              <Switch
                checked={formData.useCredit}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, useCredit: checked })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Cost per Call
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.costPerCall || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPerCall: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Edit className="h-4 w-4 mr-2" />
            Update Endpoint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
