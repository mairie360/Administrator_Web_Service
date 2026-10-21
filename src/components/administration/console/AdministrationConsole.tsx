"use client";

import { useCallback, useState } from "react";
import { usePageUrlState } from "@/lib/use-page-url-state";
import { administrationUrlSchema } from "@/lib/administration-query";
import type { InitialConsole } from "@/lib/administration-response";
import { UsersPanel } from "../users/UsersPanel";
import { RolesPanel } from "../roles/RolesPanel";
import { GroupsPanel } from "../groups/GroupsPanel";
import { SessionsPanel } from "../sessions/SessionsPanel";
import { ConsoleHeader } from "./ConsoleHeader";
import { ConsoleNotices } from "./ConsoleNotices";
import { ConsoleMetrics } from "./ConsoleMetrics";
import { ConsoleTabs } from "./ConsoleTabs";
import { consoleMetrics, type AdministrationTabId } from "./console-tabs";
import { useAdministrationData } from "./use-administration-data";

/** The administration console: header, notices, counters, tabs and the active panel. */
export function AdministrationConsole({ initialState, initialSearch }: { initialState?: InitialConsole; initialSearch?: string }) {
  const [initial] = useState(initialState);
  const pageUrl = usePageUrlState(administrationUrlSchema, initialSearch);
  // Only a users panel present in the initial render may consume this receipt.
  const [usersSeed, setUsersSeed] = useState(() => initial && pageUrl.state.tab === "users" ? { page: initial.users, error: initial.usersError } : undefined);
  const consumeUsersSeed = useCallback(() => setUsersSeed(undefined), []);
  const data = useAdministrationData(initial, consumeUsersSeed);
  const { busyAction, loading, runAction } = data;
  const activeTab = pageUrl.state.tab as AdministrationTabId;
  const setActiveTab = (tab: AdministrationTabId) => pageUrl.update({ tab });
  const [usersTotal, setUsersTotal] = useState<number | null>(initial?.users?.total ?? null);
  const locked = busyAction !== null;

  return (
    <section className="administration-console min-w-0 space-y-6 text-[var(--mairie-text)]">
      <ConsoleHeader loading={loading} locked={locked} onRefresh={() => void data.loadAll()} />
      <ConsoleNotices authRequired={data.authRequired} loadError={data.loadError} notice={data.notice} actionError={data.actionError} refreshFailure={data.refreshFailure} busyAction={busyAction}
        onCloseNotice={data.clearNotice} onCloseError={data.clearActionError}
        onRetryRefresh={() => { if (data.refreshFailure) void runAction("retry-refresh", "Données actualisées.", data.refreshFailure.retry); }} />
      <ConsoleMetrics metrics={consoleMetrics({ users: usersTotal, roles: data.roles?.length, groups: data.groups?.length, sessions: data.activeSessions?.length })} activeTab={activeTab} locked={locked} onOpen={setActiveTab} />
      <ConsoleTabs value={activeTab} locked={locked} onChange={setActiveTab} />
      {activeTab === "users" && (
        <UsersPanel initialPage={usersSeed?.page} initialError={usersSeed?.error} initialSearch={usersSeed ? initialSearch : undefined} onInitialReadConsumed={consumeUsersSeed}
          roles={data.roles ?? []} busyAction={busyAction} runAction={runAction} onTotalChange={setUsersTotal} />
      )}
      {activeTab === "roles" && <RolesPanel roles={data.roles} loading={loading || busyAction === "refresh-roles"} busyAction={busyAction} runAction={runAction} refreshRoles={data.refreshRoles} onRoleDeleted={data.confirmRoleDeletion} />}
      {activeTab === "groups" && <GroupsPanel groups={data.groups} loading={loading || busyAction === "refresh-groups"} busyAction={busyAction} runAction={runAction} refreshGroups={data.refreshGroups} onGroupDeleted={data.applyGroupDeletion} />}
      {activeTab === "sessions" && <SessionsPanel activeSessions={data.activeSessions} sessionHistory={data.sessionHistory} loading={loading || busyAction === "refresh-sessions"} busyAction={busyAction} runAction={runAction} refreshSessions={data.refreshSessions} />}
    </section>
  );
}
