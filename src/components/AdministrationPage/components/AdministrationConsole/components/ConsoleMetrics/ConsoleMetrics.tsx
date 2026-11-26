"use client";
import { MetricCard } from "@mairie360/lib-components/primitives";

import type { AdministrationTabId, ConsoleMetric } from '../ConsoleTabs';

/** C2: the three counters on the lib MetricCard (size m), each opening its tab. */
export const ConsoleMetrics = ({ metrics, activeTab, locked, onOpen }: { metrics: ConsoleMetric[]; activeTab: AdministrationTabId; locked: boolean; onOpen: (tab: AdministrationTabId) => void }) => (
  <div className="grid gap-4 sm:grid-cols-3">
    {metrics.map((metric) => (
      // Named by its whole visible text, in reading order (label, value, caption), so the name contains the visible
      // label (RGAA 11.9); the counter's own group label would otherwise name the button « Utilisateurs » alone.
      <button type="button" key={metric.tab} disabled={locked} onClick={() => onOpen(metric.tab)} aria-pressed={activeTab === metric.tab}
        aria-label={`${metric.label} ${metric.value} ${metric.caption}`} className="rounded-xl text-left">
        <MetricCard label={metric.label} value={metric.value} icon={metric.icon} size="m" trend="none" trendLabel={metric.caption} />
      </button>
    ))}
  </div>
);
