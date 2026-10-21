import { getInstanceTimeZone } from "@mairie360/lib-components/shared";

// MAIR-608: the administration controls are thin adapters over the lib primitives and the --mairie-* control tokens.
export const inputClassName =
  "h-11 w-full rounded-lg border border-[var(--mairie-control-border)] bg-[var(--mairie-control-background)] px-3 text-sm text-[var(--mairie-text)] outline-none transition placeholder:text-[var(--mairie-muted)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/15 disabled:cursor-not-allowed disabled:bg-[var(--mairie-surface-raised)]";

export const textareaClassName = `${inputClassName} min-h-24 resize-y py-3`;

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: getInstanceTimeZone(), dateStyle: "short", timeStyle: "short" }).format(date);
}
