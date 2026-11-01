"use client";

// MAIR-607: the session table is the shared SessionList of the library (same display in Settings).
import { RefreshButton, SessionList } from "@mairie360/lib-components/primitives";

import { useState } from "react";
import { type AdministrationSession } from '@/lib/administration-api';
import { Panel } from '@/components/AdministrationPage/components/Panel';
import { type RunAction } from '../../types';

import { SessionsViewSwitch, type SessionsView } from './components/SessionsViewSwitch';

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
