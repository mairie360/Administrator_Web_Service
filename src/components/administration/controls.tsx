"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export const inputClassName =
  "h-11 w-full rounded-lg border border-[#d8d5cf] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#98a2b3] focus:border-[#3c7773] focus:ring-2 focus:ring-[#3c7773]/15 disabled:cursor-not-allowed disabled:bg-[#f2f1ee]";

export const textareaClassName = `${inputClassName} min-h-24 resize-y py-3`;

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
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
      <span className="block text-sm font-semibold text-[#344054]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[#667085]">{hint}</span>}
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
      className={`administration-panel min-w-0 overflow-hidden rounded-xl border border-[#dedbd5] bg-white ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-[#ebe8e3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#172033]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
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
    primary: "border-[#315f5c] bg-[#315f5c] text-white hover:bg-[#274d4a]",
    secondary: "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f8f7f5]",
    danger: "border-[#f0b6b2] bg-white text-[#b42318] hover:bg-[#fff4f2]",
    dangerSolid: "border-[#b42318] bg-[#b42318] text-white hover:bg-[#912018]",
    ghost: "border-transparent bg-transparent text-[#475467] hover:bg-[#f2f1ee]",
  };

  return (
    <button
      type="button"
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#3c7773]/25 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[#d8d5cf] bg-[#faf9f7] px-5 py-10 text-center text-sm text-[#667085]">
      {children}
    </div>
  );
}
