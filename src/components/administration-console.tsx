"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, KeyRound, MonitorSmartphone, RefreshCw, ShieldCheck, UserCog, UsersRound, X } from "lucide-react";
import { administrationApi, type AdministrationGroup, type AdministrationRole, type AdministrationSession } from "@/lib/administration-api";
import { BffRequestError } from "@/lib/bff-client";
import { administrationErrorMessage } from "@/lib/administration-error";
import { ActionButton } from "./administration/controls";
import { UsersPanel } from "./administration/users-panel";
import { RolesPanel } from "./administration/roles-panel";
import { GroupsPanel } from "./administration/groups-panel";
import { SessionsPanel } from "./administration/sessions-panel";

type TabId = "users" | "roles" | "groups" | "sessions";

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof UserCog;
}> = [
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "roles", label: "Rôles", icon: ShieldCheck },
  { id: "groups", label: "Groupes", icon: UsersRound },
  { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
];

export function AdministrationConsole() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [usersTotal, setUsersTotal] = useState<number | null>(null);
  const [roles, setRoles] = useState<AdministrationRole[]>([]);
  const [groups, setGroups] = useState<AdministrationGroup[]>([]);
  const [activeSessions, setActiveSessions] = useState<AdministrationSession[]>([]);
  const [sessionHistory, setSessionHistory] = useState<AdministrationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const actionPending = useRef(false);
  const [refreshFailure, setRefreshFailure] = useState<{
    message: string;
    retry: () => Promise<unknown>;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const allReadRevision = useRef(0);
  const rolesReadRevision = useRef(0);
  const groupsReadRevision = useRef(0);
  const sessionsReadRevision = useRef(0);

  const loadAll = useCallback(async () => {
    if (actionPending.current) return;
    const revision = ++allReadRevision.current;
    const rolesRevision = ++rolesReadRevision.current;
    const groupsRevision = ++groupsReadRevision.current;
    const sessionsRevision = ++sessionsReadRevision.current;
    setLoading(true);
    setLoadError(null);

    const results = await Promise.allSettled([
      administrationApi.listRoles(),
      administrationApi.listGroups(),
      administrationApi.listActiveSessions(),
      administrationApi.listSessionHistory(),
    ]);

    if (revision !== allReadRevision.current) return;
    // A targeted refresh can supersede one resource without discarding the
    // independent resources (or their errors) from this global read.
    const ownsResult = [
      rolesRevision === rolesReadRevision.current,
      groupsRevision === groupsReadRevision.current,
      sessionsRevision === sessionsReadRevision.current,
      sessionsRevision === sessionsReadRevision.current,
    ];
    if (ownsResult[0] && results[0].status === "fulfilled") setRoles(results[0].value);
    if (ownsResult[1] && results[1].status === "fulfilled") setGroups(results[1].value);
    if (ownsResult[2] && results[2].status === "fulfilled") setActiveSessions(results[2].value);
    if (ownsResult[3] && results[3].status === "fulfilled") setSessionHistory(results[3].value);

    const failures = results
      .filter((_result, index) => ownsResult[index])
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason);

    setAuthRequired(
      failures.some(
        (failure) => failure instanceof BffRequestError && failure.status === 401,
      ),
    );

    if (failures.length > 0) {
      setLoadError([...new Set(failures.map(administrationErrorMessage))].join(" "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
    return () => {
      allReadRevision.current += 1;
      rolesReadRevision.current += 1;
      groupsReadRevision.current += 1;
      sessionsReadRevision.current += 1;
    };
  }, [loadAll]);

  const runAction = useCallback(
    async (
      key: string,
      successMessage: string,
      action: () => Promise<unknown>,
      refresh?: () => Promise<unknown>,
    ) => {
      // State alone cannot protect two submissions before React renders again.
      if (actionPending.current) return false;
      actionPending.current = true;
      setBusyAction(key);
      setActionError(null);
      setNotice(null);
      if (key !== "retry-refresh") setRefreshFailure(null);

      try {
        await action();
        setNotice(successMessage);
        if (refresh) {
          try {
            await refresh();
          } catch (error) {
            // The mutation is already confirmed. Never invite a second write
            // just because the subsequent read failed.
            setRefreshFailure({ message: administrationErrorMessage(error), retry: refresh });
          }
        }
        if (key === "retry-refresh") setRefreshFailure(null);
        return true;
      } catch (error) {
        setActionError(administrationErrorMessage(error));
        return false;
      } finally {
        actionPending.current = false;
        setBusyAction(null);
      }
    },
    [],
  );

  const confirmRoleDeletion = useCallback((roleId: number) => {
    // A confirmed DELETE is authoritative even if the follow-up GET fails.
    // Invalidate earlier reads so they cannot restore the deleted role.
    rolesReadRevision.current += 1;
    setRoles((current) => current.filter((role) => role.id !== roleId));
  }, []);

  const refreshRoles = useCallback(async () => {
    const revision = ++rolesReadRevision.current;
    try {
      const current = await administrationApi.listRoles();
      if (revision === rolesReadRevision.current) setRoles(current);
    } catch (error) {
      if (revision === rolesReadRevision.current) throw error;
    }
  }, []);

  const refreshGroups = useCallback(async () => {
    const revision = ++groupsReadRevision.current;
    try {
      const current = await administrationApi.listGroups();
      if (revision === groupsReadRevision.current) setGroups(current);
    } catch (error) {
      if (revision === groupsReadRevision.current) throw error;
    }
  }, []);

  const applyGroupDeletion = useCallback((groupId: number) => {
    // Confirmation owns this resource even if an earlier global read is late.
    groupsReadRevision.current += 1;
    setGroups((current) => current.filter((group) => group.id !== groupId));
  }, []);

  const refreshSessions = useCallback(async () => {
    const revision = ++sessionsReadRevision.current;
    try {
      const [current, history] = await Promise.all([
        administrationApi.listActiveSessions(),
        administrationApi.listSessionHistory(),
      ]);
      if (revision !== sessionsReadRevision.current) return;
      setActiveSessions(current);
      setSessionHistory(history);
    } catch (error) {
      if (revision === sessionsReadRevision.current) throw error;
    }
  }, []);

  const metrics = [
    {
      tab: "users" as const,
      label: "Utilisateurs",
      value: usersTotal ?? "—",
      icon: UserCog,
    },
    { tab: "roles" as const, label: "Rôles", value: roles.length, icon: ShieldCheck },
    { tab: "groups" as const, label: "Groupes", value: groups.length, icon: UsersRound },
    {
      tab: "sessions" as const,
      label: "Sessions actives",
      value: activeSessions.length,
      icon: Activity,
    },
  ];

  return (
    <section className="administration-console min-w-0 space-y-6 text-[#172033]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-[#0b1220]">Administration</h1>
          <p className="mt-1 max-w-3xl text-base leading-6 text-[#475467]">
            Gérez les comptes, les rôles et les équipes de votre mairie.
          </p>
        </div>
        <ActionButton
          variant="secondary"
          busy={loading}
          disabled={busyAction !== null}
          onClick={() => void loadAll()}
          className="shrink-0"
        >
          {!loading && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          Actualiser
        </ActionButton>
      </div>

      {authRequired && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[#f4c7c3] bg-[#fff7f6] px-4 py-3.5 text-sm text-[#912018]"
        >
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Session administrateur requise</p>
            <p className="mt-0.5 leading-5">
              Votre session a expiré. Reconnectez-vous pour accéder à l’administration.
            </p>
          </div>
        </div>
      )}

      {loadError && !authRequired && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[#f4c7c3] bg-[#fff7f6] px-4 py-3.5 text-sm text-[#912018]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Certaines données n’ont pas pu être chargées</p>
            <p className="mt-0.5 leading-5">{loadError}</p>
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#a6e3c4] bg-[#f2fff8] px-4 py-3 text-sm font-semibold text-[#05603a]"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            {notice}
          </span>
          <button type="button" aria-label="Fermer" onClick={() => setNotice(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f4c7c3] bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#912018]"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {actionError}
          </span>
          <button type="button" aria-label="Fermer" onClick={() => setActionError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {refreshFailure && (
        <div role="alert" className="rounded-xl border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm text-[#93370d]">
          <p className="font-bold">L’action est enregistrée, mais les données n’ont pas pu être actualisées.</p>
          <p className="mt-1">{refreshFailure.message} Ne répétez pas l’action.</p>
          <ActionButton
            className="mt-3"
            variant="secondary"
            busy={busyAction === "retry-refresh"}
            disabled={busyAction !== null}
            onClick={() => void runAction("retry-refresh", "Données actualisées.", refreshFailure.retry)}
          >
            Réessayer l’actualisation
          </ActionButton>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button
              type="button"
              key={metric.tab}
              disabled={busyAction !== null}
              onClick={() => setActiveTab(metric.tab)}
              className={`flex items-center gap-4 rounded-xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${
                activeTab === metric.tab ? "border-[#699c98] ring-2 ring-[#3c7773]/10" : "border-[#dedbd5]"
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#edf5f4] text-[#315f5c]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-2xl font-bold text-[#172033]">{metric.value}</span>
                <span className="block text-sm text-[#667085]">{metric.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto border-b border-[#d8d5cf]">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Sections d’administration">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                disabled={busyAction !== null}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-[#315f5c] text-[#315f5c]"
                    : "border-transparent text-[#667085] hover:text-[#344054]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "users" && (
        <UsersPanel
          roles={roles}
          busyAction={busyAction}
          runAction={runAction}
          onTotalChange={setUsersTotal}
        />
      )}
      {activeTab === "roles" && (
        <RolesPanel
          roles={roles}
          busyAction={busyAction}
          runAction={runAction}
          refreshRoles={refreshRoles}
          onRoleDeleted={confirmRoleDeletion}
        />
      )}
      {activeTab === "groups" && (
        <GroupsPanel
          groups={groups}
          busyAction={busyAction}
          runAction={runAction}
          refreshGroups={refreshGroups}
          onGroupDeleted={applyGroupDeletion}
        />
      )}
      {activeTab === "sessions" && (
        <SessionsPanel
          activeSessions={activeSessions}
          sessionHistory={sessionHistory}
          busyAction={busyAction}
          runAction={runAction}
          refreshSessions={refreshSessions}
        />
      )}
    </section>
  );
}
