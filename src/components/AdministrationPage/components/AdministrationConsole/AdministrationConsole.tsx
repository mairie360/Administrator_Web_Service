"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { administrationApi } from '@/lib/administration-api';
import { usePageUrlState } from '@/lib/use-page-url-state';
import { administrationUrlSchema } from '@/lib/administration-query';
import type { InitialConsole } from '@/lib/administration-response';
import { UsersPanel } from './components/UsersPanel';
import { RolesPanel } from './components/RolesPanel';
import { GroupsPanel } from './components/GroupsPanel';
import { ConsoleHeader } from './components/ConsoleHeader';
import { ConsoleNotices } from './components/ConsoleNotices';
import { ConsoleMetrics } from './components/ConsoleMetrics';
import { ConsoleTabs } from './components/ConsoleTabs';
import { consoleMetrics, type AdministrationTabId } from './components/ConsoleTabs';
import { useAdministrationData } from './use-administration-data';
import type { RunAction } from './types';

/** Users actions that change the number of active accounts (« N actifs »). */
const ACTIVE_COUNT_ACTIONS = /^(create|update|delete|suspend|reactivate)-user/;

/** The administration console V2: header, notices, three counters, three tabs (with their counts) and the active panel. */
export function AdministrationConsole({ initialState, initialSearch, currentUserId = null }: { initialState?: InitialConsole; initialSearch?: string; currentUserId?: number | null }) {
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
  const [usersRefresh, setUsersRefresh] = useState(0);
  // Bumped after a users action that may change the active accounts: the « N actifs » read is done again.
  const [activeRevision, setActiveRevision] = useState(0);
  // « N actifs » under the users counter: the total of the active accounts, read with the same list operation
  // (one row) each time the whole list total is known again; « — » until then. The server render's read is kept.
  const [activeUsers, setActiveUsers] = useState<number | null>(initial?.activeUsers ?? null);
  // The server render's read covers the first (total, refresh) pair: keyed rather than a one-shot flag, so the
  // StrictMode effect replay of that same pair does not read again from the browser.
  const seededActiveKey = useRef<string | null>(typeof initial?.activeUsers === "number" ? `${initial?.users?.total ?? null}:0:0` : null);
  useEffect(() => {
    const key = `${usersTotal}:${usersRefresh}:${activeRevision}`;
    if (seededActiveKey.current === key) return;
    seededActiveKey.current = null;
    setActiveUsers(null);
    if (usersTotal === null) return;
    let current = true;
    administrationApi.listUsers({ status: "active", pageSize: 1 }).then((page) => { if (current) setActiveUsers(page.total); }, () => undefined);
    return () => { current = false; };
  }, [usersTotal, usersRefresh, activeRevision]);
  const locked = busyAction !== null;
  const runUsersAction: RunAction = async (key, successMessage, action, refresh) => {
    const done = await runAction(key, successMessage, action, refresh);
    if (done && ACTIVE_COUNT_ACTIONS.test(key)) setActiveRevision((value) => value + 1);
    return done;
  };

  return (
    <section className="administration-console min-w-0 space-y-6 text-[var(--mairie-text)]">
      <ConsoleHeader loading={loading} locked={locked} onRefresh={() => { setUsersRefresh((value) => value + 1); void data.loadAll(); }} />
      <ConsoleNotices authRequired={data.authRequired} loadError={data.loadError} notice={data.notice} actionError={data.actionError} refreshFailure={data.refreshFailure} busyAction={busyAction}
        onCloseNotice={data.clearNotice} onCloseError={data.clearActionError}
        onRetryRefresh={() => { if (data.refreshFailure) void runAction("retry-refresh", "Données actualisées.", data.refreshFailure.retry); }}
        onReconnect={() => void data.reconnect()} reconnecting={data.reconnecting} />
      <ConsoleMetrics metrics={consoleMetrics({ users: usersTotal, activeUsers, roles: data.roles?.length, groups: data.groups?.length })} activeTab={activeTab} locked={locked} onOpen={setActiveTab} />
      <ConsoleTabs value={activeTab} locked={locked} counts={{ users: usersTotal, roles: data.roles?.length, groups: data.groups?.length }} onChange={setActiveTab} />
      {activeTab === "users" && (
        <UsersPanel initialPage={usersSeed?.page} initialError={usersSeed?.error} initialSearch={usersSeed ? initialSearch : undefined} onInitialReadConsumed={consumeUsersSeed}
          roles={data.roles ?? []} busyAction={busyAction} runAction={runUsersAction} onTotalChange={setUsersTotal} currentUserId={currentUserId} refreshSignal={usersRefresh} />
      )}
      {activeTab === "roles" && <RolesPanel roles={data.roles} loading={loading || busyAction === "refresh-roles"} busyAction={busyAction} runAction={runAction} refreshRoles={data.refreshRoles} onRoleDeleted={data.confirmRoleDeletion} />}
      {activeTab === "groups" && <GroupsPanel groups={data.groups} loading={loading || busyAction === "refresh-groups"} busyAction={busyAction} runAction={runAction} refreshGroups={data.refreshGroups} onGroupDeleted={data.applyGroupDeletion} />}
    </section>
  );
}
