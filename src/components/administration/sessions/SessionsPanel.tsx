"use client";

// MAIR-607: the session table is the shared SessionList of the library (same display in Settings).
import { RefreshButton, SegmentedControl, SessionList } from "@mairie360/lib-components/primitives";

import { useState } from "react";
import { Clock3, History } from "lucide-react";
import { type AdministrationSession } from "@/lib/administration-api";
import { Panel } from "../shared/controls";
import { type RunAction } from "../shared/types";

export type SessionsView = "active" | "history";

/** Active / history switch with the counts (Figma Base/SegmentedControl). */
export const SessionsViewSwitch = ({ view, onChange, activeCount, historyCount }: { view: SessionsView; onChange: (view: SessionsView) => void; activeCount?: number; historyCount?: number }) => (
  <SegmentedControl label="Sessions affichées" className="mb-5" value={view} onChange={onChange} options={[
    { key: "active", label: `Actives (${activeCount ?? "—"})`, icon: Clock3 },
    { key: "history", label: `Historique (${historyCount ?? "—"})`, icon: History },
  ]} />
);

export function SessionsPanel({ activeSessions, sessionHistory, loading, busyAction, runAction, refreshSessions }: {
  activeSessions: AdministrationSession[] | null;
  sessionHistory: AdministrationSession[] | null;
  loading: boolean;
  busyAction: string | null;
  runAction: RunAction;
  refreshSessions: () => Promise<void>;
}) {
  const [view, setView] = useState<SessionsView>("active");
  const visibleSessions = view === "active" ? activeSessions : sessionHistory;
  const refresh = () => void runAction("refresh-sessions", "Sessions actualisées.", refreshSessions);
  return (
    <div className="space-y-5">
      <Panel
        title="Sessions"
        description={view === "active" ? "Consultez les connexions actuellement ouvertes." : "Consultez l’historique des connexions."}
        action={<RefreshButton label="Actualiser" variant="outline" tone="neutral" loading={busyAction === "refresh-sessions"} onClick={refresh} />}
      >
        <SessionsViewSwitch view={view} onChange={setView} activeCount={activeSessions?.length} historyCount={sessionHistory?.length} />
        <SessionList sessions={visibleSessions} loading={loading} showIds unavailableMessage="Les sessions n’ont pas pu être chargées." onRetry={refresh} />
      </Panel>
    </div>
  );
}
