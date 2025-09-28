"use client";

import React from "react";
import { MultiSelect, Option } from "@/app/components/ui/multi-select";
import { ChainSymbol } from "@/app/components/ChainSymbol";

// Common blockchain networks
const PAYMENT_CHAINS: Option[] = [
  {
    label: "Base",
    value: "base",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="8453" size="sm" className={className} />
    ),
  },
  {
    label: "Polygon",
    value: "polygon",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="137" size="sm" className={className} />
    ),
  },
  {
    label: "Avalanche",
    value: "avalanche",
    icon: ({ className }: { className?: string }) => (
      <ChainSymbol symbol="43114" size="sm" className={className} />
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
