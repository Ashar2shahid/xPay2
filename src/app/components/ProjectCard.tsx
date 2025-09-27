"use client";

import { Project } from "@/types";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";
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
      className="p-6 md:p-7 cursor-pointer transition-colors transition-shadow hover:bg-card-hover hover:shadow-sm group rounded-xl"
      onClick={() => router.push(`/project/${project.id}`)}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || "No description provided"}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {project.paymentChains.map((chainId, index) => (
              <ChainSymbol key={index} symbol={chainId} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {project.endpoints.length} endpoint
            {project.endpoints.length !== 1 ? "s" : ""}
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  );
}
