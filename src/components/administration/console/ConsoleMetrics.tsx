"use client";
import { Icon } from "@mairie360/lib-components/primitives";

import type { AdministrationTabId, ConsoleMetric } from "./console-tabs";

/** The four counters, each opening its tab (Figma MetricCard). */
export const ConsoleMetrics = ({ metrics, activeTab, locked, onOpen }: { metrics: ConsoleMetric[]; activeTab: AdministrationTabId; locked: boolean; onOpen: (tab: AdministrationTabId) => void }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map((metric) => (
      <button type="button" key={metric.tab} disabled={locked} onClick={() => onOpen(metric.tab)} aria-pressed={activeTab === metric.tab}
        className={`flex items-center gap-4 rounded-xl border bg-[var(--mairie-surface)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${activeTab === metric.tab ? "border-[var(--mairie-accent)] ring-2 ring-[var(--mairie-accent)]/10" : "border-[var(--mairie-border)]"}`}>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--mairie-accent-surface)] text-[var(--mairie-accent)]"><Icon icon={metric.icon} size="m" /></span>
        {/* Text/Metric and Text/Caption styles as native text: the button keeps its accessible name. */}
        <span>
          <span className="block text-2xl font-bold text-[var(--mairie-text)]">{metric.value}</span>
          <span className="block text-sm text-[var(--mairie-muted)]">{metric.label}</span>
        </span>
      </button>
    ))}
  </div>
);
