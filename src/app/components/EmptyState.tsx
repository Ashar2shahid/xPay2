"use client";

import React from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`p-8 md:p-12 text-center ${className}`}>
      {Icon && (
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
      )}
      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.icon}
          {action.text}
        </Button>
      )}
    </Card>
  );
}
