import type { GroupColor } from "./administration-api";

/**
 * MAIR-923: the colours a group card can take, from the charter palette (the module colours of the lib),
 * with their French names. `null` (no colour chosen) is shown with the neutral border.
 */
export const GROUP_COLOR_STYLES: Record<GroupColor, { label: string; token: string }> = {
  blue: { label: "Bleu", token: "var(--mairie-module-dashboard)" },
  teal: { label: "Turquoise", token: "var(--mairie-module-projects)" },
  green: { label: "Vert", token: "var(--mairie-module-training)" },
  orange: { label: "Orange", token: "var(--mairie-module-calendar)" },
  purple: { label: "Violet", token: "var(--mairie-module-messaging)" },
  pink: { label: "Rose", token: "var(--mairie-module-workflows)" },
  neutral: { label: "Neutre", token: "var(--mairie-muted)" },
};

/** The CSS colour of a group (its own, or the neutral one). */
export const groupColorToken = (color: GroupColor | null | undefined) => GROUP_COLOR_STYLES[color ?? "neutral"].token;

/** « Aucun projet », « 1 projet », « 3 projets ». */
export const projectCountLabel = (count: number | undefined) =>
  !count ? "Aucun projet" : `${count} projet${count > 1 ? "s" : ""}`;
