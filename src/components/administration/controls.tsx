"use client";
import { getInstanceTimeZone } from "@mairie360/lib-components/shared";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export const inputClassName =
  "h-11 w-full rounded-lg border border-[var(--mairie-control-border)] bg-[var(--mairie-control-background)] px-3 text-sm text-[var(--mairie-text)] outline-none transition placeholder:text-[var(--mairie-muted)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/15 disabled:cursor-not-allowed disabled:bg-[var(--mairie-surface-raised)]";

export const textareaClassName = `${inputClassName} min-h-24 resize-y py-3`;

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: getInstanceTimeZone(),
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="block text-sm font-semibold text-[var(--mairie-text)]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[var(--mairie-muted)]">{hint}</span>}
    </label>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`administration-panel min-w-0 overflow-hidden rounded-xl border border-[var(--mairie-border)] bg-[var(--mairie-surface)] ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--mairie-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[var(--mairie-text)]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-[var(--mairie-muted)]">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ActionButton({
  variant = "primary",
  busy = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "dangerSolid" | "ghost";
  busy?: boolean;
}) {
  const variants = {
    primary: "border-[var(--mairie-action-background)] bg-[var(--mairie-action-background)] text-[var(--mairie-on-action)] hover:bg-[var(--mairie-action-hover-background)]",
    secondary: "border-[var(--mairie-control-border)] bg-[var(--mairie-surface)] text-[var(--mairie-text)] hover:bg-[var(--mairie-surface-raised)]",
    danger: "border-[var(--mairie-error-text)] bg-[var(--mairie-surface)] text-[var(--mairie-error-text)] hover:bg-[var(--mairie-error-surface)]",
    dangerSolid: "border-[var(--mairie-error-action-background)] bg-[var(--mairie-error-action-background)] text-[var(--mairie-on-action)] hover:bg-[var(--mairie-error-action-hover-background)]",
    ghost: "border-transparent bg-transparent text-[var(--mairie-muted)] hover:bg-[var(--mairie-surface-raised)]",
  };

  return (
    <button
      type="button"
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/25 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
