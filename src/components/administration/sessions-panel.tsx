"use client";

import { useEffect, useState } from "react";
import { Clock3, History, RefreshCw } from "lucide-react";
import { type AdministrationSession } from "@/lib/administration-api";
import { administrationSessionState, nextSessionExpiryDelay } from "@/lib/administration-session-state";
import { formatDate, Panel, ActionButton, EmptyState } from "./controls";
import { type RunAction } from "./types";

function SessionTable({ sessions }: { sessions: AdministrationSession[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (typeof document === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      const delay = nextSessionExpiryDelay(sessions, Date.now());
      if (delay !== null) timer = setTimeout(onReturn, delay);
    };
    const onReturn = () => { setNow(Date.now()); schedule(); };
    const onVisibility = () => { if (document.visibilityState === "visible") onReturn(); };
    timer = setTimeout(onReturn, 0);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sessions]);
  if (sessions.length === 0) {
    return <EmptyState>Aucune session à afficher.</EmptyState>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#e4e1dc]">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-[#667085]">
          <tr>
            <th className="px-4 py-3">Appareil</th>
            <th className="px-4 py-3">Adresse IP</th>
            <th className="px-4 py-3">Créée le</th>
            <th className="px-4 py-3">Expiration</th>
            <th className="px-4 py-3">État</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ebe8e3]">
          {sessions.map((session) => {
            const state = administrationSessionState(session, now);
            const labels = { active: "Active", expired: "Expirée", revoked: "Révoquée", unknown: "État indéterminé" };
            const colors = { active: "bg-[#ecfdf3] text-[#027a48]", expired: "bg-[#fffaeb] text-[#b54708]", revoked: "bg-[#fef3f2] text-[#b42318]", unknown: "bg-[#f2f4f7] text-[#475467]" };
            return (
            <tr key={session.id} className="bg-white">
              <td className="px-4 py-3.5">
                <div className="font-semibold text-[#344054]">{session.device_info}</div>
                <div className="mt-0.5 font-mono text-xs text-[#98a2b3]">
                  {session.id}
                </div>
              </td>
              <td className="px-4 py-3.5 text-[#475467]">{session.ip_address}</td>
              <td className="px-4 py-3.5 text-[#475467]">{formatDate(session.created_at)}</td>
              <td className="px-4 py-3.5 text-[#475467]">{formatDate(session.expires_at)}</td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[state]}`}
                >
                  {labels[state]}
                </span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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
        {visibleSessions === null ? (
          <EmptyState>
            <p role="status">{loading ? "Chargement des sessions…" : "Les sessions n’ont pas pu être chargées. Utilisez Actualiser pour réessayer."}</p>
          </EmptyState>
        ) : <SessionTable sessions={visibleSessions} />}
      </Panel>

    </div>
  );
}
