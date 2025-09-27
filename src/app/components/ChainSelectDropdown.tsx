"use client";

import React from "react";
import { MultiSelect, Option } from "@/app/components/ui/multi-select";
import { ChainSymbol } from "@/app/components/ChainSymbol";

// Common blockchain networks
const PAYMENT_CHAINS: Option[] = [
  {
    label: "Ethereum",
    value: "ethereum",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="ETH" size="sm" className={className} />
    ),
  },
  {
    label: "Polygon",
    value: "polygon",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="MATIC" size="sm" className={className} />
    ),
  },
  {
    label: "Binance Smart Chain",
    value: "bsc",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="BNB" size="sm" className={className} />
    ),
  },
  {
    label: "Arbitrum",
    value: "arbitrum",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="ARB" size="sm" className={className} />
    ),
  },
  {
    label: "Optimism",
    value: "optimism",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="OP" size="sm" className={className} />
    ),
  },
  {
    label: "Avalanche",
    value: "avalanche",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="AVAX" size="sm" className={className} />
    ),
  },
  {
    label: "Fantom",
    value: "fantom",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="FTM" size="sm" className={className} />
    ),
  },
  {
    label: "Solana",
    value: "solana",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="SOL" size="sm" className={className} />
    ),
  },
];

interface ChainSelectDropdownProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChainSelectDropdown({
  value,
  onValueChange,
  placeholder = "Select payment chains",
  className,
}: ChainSelectDropdownProps) {
  return (
    <MultiSelect
      options={PAYMENT_CHAINS}
      onValueChange={onValueChange}
      defaultValue={value}
      placeholder={placeholder}
      animation={2}
      maxCount={3}
      className={className}
    />
  );
}

export { PAYMENT_CHAINS };
