"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { Button, ConfirmModal, SectionTitle, SessionList, describeUserAgent, sessionState } from "@mairie360/lib-components/primitives";

import { administrationApi, type AccountStatus, type AdministrationSession } from '@/lib/administration-api';

/** « Firefox 132 · Windows » from the user-agent the client gave at sign-in. */
export const deviceName = (userAgent: string) => { const device = describeUserAgent(userAgent); return `${device.browser} · ${device.os}`; };

/** Ended sessions are kept 30 days in the history of the record (C5). */
export const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** C5: the active sessions first, then the sessions ended in the last 30 days. */
export function splitSessions(sessions: AdministrationSession[], now = Date.now()) {
  const active = sessions.filter((session) => sessionState(session, now) === "active");
  const history = sessions.filter((session) => {
    if (sessionState(session, now) === "active") return false;
    const ended = Date.parse(session.revoked_at ?? session.expires_at);
    return Number.isFinite(ended) && now - ended <= HISTORY_DAYS * DAY_MS;
  });
  return { active, history };
}

/** Empty states of the active list, by state of the account. */
export function emptySessions(status: AccountStatus, name: string) {
  if (status === "invited") return { title: "Aucune session ouverte", description: `${name} n’a pas encore activé son compte.` };
  if (status === "suspended") return { title: "Aucune session ouverte", description: "Le compte est suspendu : toutes ses sessions ont été fermées." };
  if (status === "inactive") return { title: "Aucune session ouverte", description: "Le compte est inactif." };
  return { title: "Aucune session ouverte", description: undefined };
}

export interface UserSessionsProps {
  userId: number;
  name: string;
  status: AccountStatus;
  /** Writes of the console run one at a time; true while another one runs. */
  locked: boolean;
  /** Runs a confirmed write; resolves to whether it succeeded. */
  onRevoke: (action: () => Promise<void>, successMessage: string) => Promise<boolean>;
  /** The number of open sessions changed (the « En ligne » pill of the list). */
  onActiveCountChange: (count: number) => void;
}

/**
 * C5 / C12: the sessions of the user in the record: compact list of the active ones with « Déconnecter »
 * (one) and « Tout déconnecter », each confirmed with a secondary button (red is kept for deletions), then
 * the history of the last 30 days. Unavailable state with « Réessayer » when the BFF does not answer.
 */
export function UserSessions({ userId, name, status, locked, onRevoke, onActiveCountChange }: UserSessionsProps) {
  const [sessions, setSessions] = useState<AdministrationSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ kind: "one"; session: AdministrationSession } | { kind: "all" } | null>(null);
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const countChanged = useRef(onActiveCountChange);
  useEffect(() => { countChanged.current = onActiveCountChange; }, [onActiveCountChange]);

  const load = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    try {
      const received = await administrationApi.listUserSessions(userId);
      if (current !== revision.current) return;
      setSessions(received);
      countChanged.current(splitSessions(received).active.length);
    } catch {
      if (current === revision.current) setSessions(null);
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, [userId]);
  useEffect(() => { void load(); return () => { revision.current += 1; }; }, [load]);

  const { active, history } = splitSessions(sessions ?? []);
  const empty = emptySessions(status, name);
  const runConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    const one = confirm.kind === "one" ? confirm.session : null;
    const succeeded = one
      ? await onRevoke(() => administrationApi.revokeUserSession(userId, one.id), "Session déconnectée")
      : await onRevoke(() => administrationApi.revokeUserSessions(userId), "Toutes les sessions ont été déconnectées");
    setBusy(false);
    if (!succeeded) return;
    setConfirm(null);
    await load();
  };

  return (
    <section aria-labelledby={`user-${userId}-sessions`} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle id={`user-${userId}-sessions`} className="flex-1">Sessions actives</SectionTitle>
        {active.length > 0 && (
          <Button variant="outline" tone="neutral" size="s" icon={LogOut} disabled={locked} onClick={() => setConfirm({ kind: "all" })}>Tout déconnecter</Button>
        )}
      </div>
      <SessionList layout="compact" sessions={sessions === null ? null : active} loading={loading && sessions === null}
        deviceLabel={(session) => deviceName(session.device_info)}
        onRevoke={locked ? undefined : (session) => setConfirm({ kind: "one", session: session as AdministrationSession })}
        emptyTitle={empty.title} emptyDescription={empty.description}
        unavailableTitle="Sessions indisponibles" unavailableDescription="Le service ne répond pas pour le moment." onRetry={() => void load()} />
      {sessions !== null && (
        <>
          <SectionTitle as="h4">Historique des connexions ({HISTORY_DAYS} jours)</SectionTitle>
          <SessionList layout="compact" sessions={history} dateColumnLabel="Fin" deviceLabel={(session) => deviceName(session.device_info)}
            emptyTitle="Aucune session terminée" emptyDescription={`Les sessions expirées ou révoquées des ${HISTORY_DAYS} derniers jours apparaîtront ici.`} />
        </>
      )}
      <ConfirmModal role="alertdialog" open={confirm !== null} destructive={false} confirmIcon={LogOut} busy={busy}
        title={confirm?.kind === "all" ? "Déconnecter toutes les sessions ?" : "Déconnecter cette session ?"}
        message={confirm?.kind === "all"
          ? `${name} sera déconnecté de tous ses appareils et devra se reconnecter.`
          : `${name} sera déconnecté de cet appareil (${confirm?.kind === "one" ? deviceName(confirm.session.device_info) : ""}).`}
        confirmLabel={confirm?.kind === "all" ? "Tout déconnecter" : "Déconnecter"}
        onCancel={() => setConfirm(null)} onConfirm={() => void runConfirmed()} />
    </section>
  );
}
