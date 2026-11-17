"use client";

import { DURATIONS, type DurationKey } from "../lib/durations";
import { Segmented } from "./ui";

export function DurationPicker({
  value,
  onChange,
  available,
  tone = "light",
  size = "md",
  stretch,
  compact,
  className,
}: {
  value: DurationKey;
  onChange: (d: DurationKey) => void;
  /** Durations the listing offers; others are shown struck through. */
  available?: DurationKey[];
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  stretch?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Segmented
      label="Duración del alquiler"
      value={value}
      onChange={onChange}
      tone={tone}
      size={size}
      stretch={stretch}
      className={className}
      options={DURATIONS.map((d) => ({
        value: d.key,
        label: compact ? d.short : d.label,
        disabled: available ? !available.includes(d.key) : false,
        title:
          available && !available.includes(d.key) ? `No se alquila por ${d.label}` : d.contract,
      }))}
    />
  );
}
