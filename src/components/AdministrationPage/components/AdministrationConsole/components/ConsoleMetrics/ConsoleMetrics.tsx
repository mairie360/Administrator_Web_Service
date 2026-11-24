"use client";
import { MetricCard } from "@mairie360/lib-components/primitives";

import type { AdministrationTabId, ConsoleMetric } from '../ConsoleTabs';

/** C2: the three counters on the lib MetricCard (size m), each opening its tab. */
export const ConsoleMetrics = ({ metrics, activeTab, locked, onOpen }: { metrics: ConsoleMetric[]; activeTab: AdministrationTabId; locked: boolean; onOpen: (tab: AdministrationTabId) => void }) => (
  <div className="grid gap-4 sm:grid-cols-3">
    {metrics.map((metric) => (
      <button type="button" key={metric.tab} disabled={locked} onClick={() => onOpen(metric.tab)} aria-pressed={activeTab === metric.tab}
        aria-label={`${metric.label} : ${metric.value}`} className="rounded-xl text-left">
        <MetricCard label={metric.label} value={metric.value} icon={metric.icon} size="m" trend="none" trendLabel={metric.caption} />
      </button>
    ))}
  </div>
);
