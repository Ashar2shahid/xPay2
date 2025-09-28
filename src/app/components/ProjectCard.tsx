"use client";

import { Project } from "@/types";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Maximize2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChainSymbol } from "./ChainSymbol";
interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  // Using filler data for stats since API doesn't provide these yet
  const totalRequests = 0;
  const avgLatency = 0;
  const successRate = 0;

  const getStatusColor = (successRate: number) => {
    if (successRate >= 99) return "success";
    if (successRate >= 95) return "warning";
    return "destructive";
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 99) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:bg-card-hover shadow-lg group rounded-xl overflow-hidden grid"
      onClick={() => router.push(`/project/${project.id}`)}
    >
      {/* Window Bar Header */}
      <div className="flex items-center justify-between p-2 bg-muted/30 border border-base-500">
        {/* Left: Title */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors font-display truncate">
            {project.name}
          </h3>
        </div>

        {/* Right: Control Buttons */}
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500">
            <Maximize2 className="h-3 w-3 text-muted-foreground" />
          </button>
          <button className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors border border-base-500">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Card Content */}

      <div>
        <p className="text-sm p-1 text-muted-foreground line-clamp-2">
          {project.description || "No description provided"}
        </p>
      </div>

      <div className="flex items-center justify-between p-1 border border-base-500 ">
        <div className="text-xs text-muted-foreground">
          {project.endpoints.length} endpoint
          {project.endpoints.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-1">
          {project.paymentChains.map((chainId, index) => (
            <ChainSymbol key={index} symbol={chainId} />
          ))}
        </div>
      </div>
    </Card>
  );
}
