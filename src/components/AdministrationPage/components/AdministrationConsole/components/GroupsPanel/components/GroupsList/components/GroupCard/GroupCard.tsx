"use client";
import { Layers3 } from "lucide-react";
import { Icon } from "@mairie360/lib-components/primitives";

import type { AdministrationGroup } from '@/lib/administration-api';
import { groupColorToken, projectCountLabel } from '@/lib/group-colors';

/** One group of the list, bordered with its colour (MAIR-923) and with its projects (F20): opens its detail. */
export const GroupCard = ({ group, selected, onOpen }: { group: AdministrationGroup; selected: boolean; onOpen: (groupId: number) => void }) => (
  <button type="button" onClick={() => onOpen(group.id)} aria-pressed={selected} data-group-id={group.id}
    style={{ borderLeftColor: groupColorToken(group.color), borderLeftWidth: 4 }} data-group-color={group.color ?? "default"}
    className={"rounded-lg border p-4 text-left transition hover:border-[var(--mairie-accent)] hover:bg-[var(--mairie-accent-surface)] " + (selected ? "border-[var(--mairie-accent)] bg-[var(--mairie-accent-surface)] ring-2 ring-[var(--mairie-accent)]/10" : "border-[var(--mairie-border)] bg-[var(--mairie-surface)]")}>
    {/* Native text inside the button keeps its accessible name complete. */}
    <span className="flex items-center justify-between gap-3">
      <span className="font-bold text-[var(--mairie-text)]">{group.name}</span>
      <span className="shrink-0 font-mono text-xs text-[var(--mairie-muted)]">#{group.id}</span>
    </span>
    <span className="mt-1.5 line-clamp-2 block text-sm leading-5 text-[var(--mairie-muted)]">{group.description || "Aucune description"}</span>
    <span className="mt-2 block text-xs text-[var(--mairie-muted)]">{projectCountLabel(group.project_count)}</span>
    <span className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--mairie-accent)]"><Icon icon={Layers3} size="xs" />Ouvrir le groupe</span>
  </button>
);
