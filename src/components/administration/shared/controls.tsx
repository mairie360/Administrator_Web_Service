"use client";
import { getInstanceTimeZone } from "@mairie360/lib-components/shared";
import { Button, Help, SectionTitle, Text } from "@mairie360/lib-components/primitives";
import type { ButtonProps } from "@mairie360/lib-components/primitives";

import { type ReactNode } from "react";

// MAIR-608: the administration controls are thin adapters over the lib primitives
// (Button, SectionTitle, Help, Text) and the --mairie-* control tokens.
export const inputClassName =
  "h-11 w-full rounded-lg border border-[var(--mairie-control-border)] bg-[var(--mairie-control-background)] px-3 text-sm text-[var(--mairie-text)] outline-none transition placeholder:text-[var(--mairie-muted)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/15 disabled:cursor-not-allowed disabled:bg-[var(--mairie-surface-raised)]";

export const textareaClassName = `${inputClassName} min-h-24 resize-y py-3`;

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: getInstanceTimeZone(), dateStyle: "short", timeStyle: "short" }).format(date);
}

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

/** One administration card: h2 title, description and an action on the right (Figma Base/Panel). */
export function Panel({ title, description, action, children, className = "" }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`administration-panel min-w-0 overflow-hidden rounded-xl border border-[var(--mairie-border)] bg-[var(--mairie-surface)] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-[var(--mairie-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <SectionTitle size="l" weight="bold">{title}</SectionTitle>
          {description && <Help className="mt-1">{description}</Help>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export type ActionVariant = "primary" | "secondary" | "danger" | "dangerSolid" | "ghost";
const appearance: Record<ActionVariant, Pick<ButtonProps, "variant" | "tone">> = {
  primary: { variant: "solid", tone: "primary" },
  secondary: { variant: "outline", tone: "neutral" },
  danger: { variant: "outline", tone: "danger" },
  dangerSolid: { variant: "solid", tone: "danger" },
  ghost: { variant: "ghost", tone: "neutral" },
};

/** Administration action on the lib `Button`: the variant names the role, `busy` shows the spinner and disables it. */
export function ActionButton({ variant = "primary", busy = false, children, ...props }: Omit<ButtonProps, "variant" | "tone" | "loading"> & { variant?: ActionVariant; busy?: boolean }) {
  return <Button {...props} {...appearance[variant]} loading={busy} data-action-variant={variant}>{children}</Button>;
}
