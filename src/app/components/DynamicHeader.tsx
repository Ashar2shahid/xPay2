"use client";

import React from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function DynamicHeader() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Helper function to determine route type
  const getRouteType = () => {
    if (pathname === "/") return "home";
    if (pathname === "/create-project") return "create-project";
    if (pathname.match(/^\/project\/[^/]+$/)) return "project-detail";
    if (pathname.match(/^\/project\/[^/]+\/endpoint\/[^/]+$/))
      return "endpoint-detail";
    return "unknown";
  };

  const routeType = getRouteType();

  // Get data based on route
  const projectId = params?.id as string;

  // Render simple navigation header based on route
  switch (routeType) {
    case "home":
      // No header for home page
      return null;

    case "create-project":
      return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
      );

    case "project-detail":
      return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
      );

    case "endpoint-detail":
      return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/project/${projectId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </div>
        </header>
      );

    default:
      return null;
  }
}
