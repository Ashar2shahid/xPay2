import React from "react";
import { SymbolLogo, ChainLogo } from "@api3/logos";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

const mapNamesToIds: Record<string, number> = {
  base: 8453,
  matic: 137,
  avax: 43114,
};

export function ChainSymbol({
  symbol,
  size = "sm",
  className,
  alt,
}: ChainSymbolProps) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const id = mapNamesToIds[symbol.toLowerCase()] || symbol;
  return (
    <Image
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      src={ChainLogo(id)}
      alt={alt || symbol}
      width={24}
      height={24}
      className={cn("shrink-0 object-contain", sizeClasses[size], className)}
      onError={(e: any) => {
        // Hide image if logo doesn't exist
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        //   (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
