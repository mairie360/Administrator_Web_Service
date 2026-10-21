"use client";
import { Help, SectionTitle } from "@mairie360/lib-components/primitives";
import { type ReactNode } from "react";

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
