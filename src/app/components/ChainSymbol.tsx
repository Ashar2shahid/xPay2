import React from "react";
import { SymbolLogo } from "@api3/logos";
import { cn } from "@/lib/utils";

export interface ChainSymbolProps {
  symbol: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  alt?: string;
}

const sizeClasses = {
  xs: "w-3 h-3 max-w-3 max-h-3",
  sm: "w-4 h-4 max-w-4 max-h-4",
  md: "w-5 h-5 max-w-5 max-h-5",
  lg: "w-6 h-6 max-w-6 max-h-6",
};

export function ChainSymbol({
  symbol,
  size = "sm",
  className,
  alt,
}: ChainSymbolProps) {
  return (
    <img
      src={SymbolLogo(symbol)}
      alt={alt || symbol}
      className={cn("shrink-0 object-contain", sizeClasses[size], className)}
      onError={(e) => {
        // Hide image if logo doesn't exist
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
