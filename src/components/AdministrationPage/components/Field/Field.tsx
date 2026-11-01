"use client";
import { Text } from "@mairie360/lib-components/primitives";
import { type ReactNode } from "react";

/** Label wrapping its control (the control's accessible name is the label text), with an optional hint. */
export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <Text as="span" size="s" weight="semibold" className="block">{label}</Text>
      {children}
      {hint && <Text as="span" size="xs" tone="muted" className="block">{hint}</Text>}
    </label>
  );
}
