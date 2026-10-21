"use client";

// MAIR-607: the session table is the shared SessionList of the library (same display in Settings).
import { SessionList } from "@mairie360/lib-components/primitives";

import { useState } from "react";
import { Clock3, History, RefreshCw } from "lucide-react";
import { type AdministrationSession } from "@/lib/administration-api";
import { Panel, ActionButton } from "./controls";
import { type RunAction } from "./types";

export function SessionsPanel({
  activeSessions,
  sessionHistory,
  loading,
  busyAction,
  runAction,
  refreshSessions,
}: {
  activeSessions: AdministrationSession[] | null;
  sessionHistory: AdministrationSession[] | null;
  loading: boolean;
  busyAction: string | null;
  runAction: RunAction;
  refreshSessions: () => Promise<void>;
}) {
  const [view, setView] = useState<"active" | "history">("active");
  const visibleSessions = view === "active" ? activeSessions : sessionHistory;

  return (
    <div className="space-y-5">
      <Panel
        title="Sessions"
        description={
          view === "active"
            ? "Consultez les connexions actuellement ouvertes."
            : "Consultez l’historique des connexions."
        }
        action={
          <ActionButton
            variant="secondary"
            busy={busyAction === "refresh-sessions"}
            onClick={() =>
              void runAction("refresh-sessions", "Sessions actualisées.", refreshSessions)
            }
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Actualiser
          </ActionButton>
        }
      >
        <div className="mb-5 inline-flex rounded-lg bg-[#f2f1ee] p-1">
          <button
            type="button"
            onClick={() => setView("active")}
            className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
              view === "active" ? "bg-white text-[#315f5c] shadow-sm" : "text-[#667085]"
            }`}
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Actives ({activeSessions?.length ?? "—"})
          </button>
          <button
            type="button"
            onClick={() => setView("history")}
            className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
              view === "history" ? "bg-white text-[#315f5c] shadow-sm" : "text-[#667085]"
            }`}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            Historique ({sessionHistory?.length ?? "—"})
          </button>
        </div>
        <SessionList
          sessions={visibleSessions}
          loading={loading}
          showIds
          unavailableMessage="Les sessions n’ont pas pu être chargées."
          onRetry={() => void runAction("refresh-sessions", "Sessions actualisées.", refreshSessions)}
        />
      </Panel>

    </div>
  );
}
