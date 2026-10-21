"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { administrationApi, type AdministrationGroup, type AdministrationRole, type AdministrationSession } from "@/lib/administration-api";
import { BffRequestError } from "@/lib/bff-client";
import { administrationErrorMessage } from "@/lib/administration-error";
import type { InitialConsole } from "@/lib/administration-response";
import { subscribePageReturn } from "@/lib/page-return";

export interface RefreshFailure { message: string; retry: () => Promise<unknown> }

/**
 * Roles, groups and sessions of the console: one global read (each resource owned by its own
 * revision), targeted refreshes, confirmed deletions that later reads cannot undo, and `runAction`,
 * the single-flight write runner that separates a refused write from a failed follow-up read.
 */
export function useAdministrationData(initial: InitialConsole | undefined, onMutationConfirmed: () => void) {
  const [roles, setRoles] = useState<AdministrationRole[] | null>(initial?.roles ?? null);
  const [groups, setGroups] = useState<AdministrationGroup[] | null>(initial?.groups ?? null);
  const [activeSessions, setActiveSessions] = useState<AdministrationSession[] | null>(initial?.activeSessions ?? null);
  const [sessionHistory, setSessionHistory] = useState<AdministrationSession[] | null>(initial?.sessionHistory ?? null);
  const [loading, setLoading] = useState(initial === undefined);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const actionPending = useRef(false);
  const [refreshFailure, setRefreshFailure] = useState<RefreshFailure | null>(null);
  const [loadError, setLoadError] = useState<string | null>(initial?.error ?? null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(initial?.authRequired ?? false);
  const allReadRevision = useRef(0);
  const rolesReadRevision = useRef(0);
  const groupsReadRevision = useRef(0);
  const sessionsReadRevision = useRef(0);
  const mutationConfirmed = useRef(onMutationConfirmed);
  useEffect(() => { mutationConfirmed.current = onMutationConfirmed; }, [onMutationConfirmed]);

  const loadAll = useCallback(async () => {
    if (actionPending.current) return;
    const revision = ++allReadRevision.current;
    const rolesRevision = ++rolesReadRevision.current;
    const groupsRevision = ++groupsReadRevision.current;
    const sessionsRevision = ++sessionsReadRevision.current;
    setLoading(true);
    setLoadError(null);
    const results = await Promise.allSettled([administrationApi.listRoles(), administrationApi.listGroups(), administrationApi.listActiveSessions(), administrationApi.listSessionHistory()]);
    if (revision !== allReadRevision.current) return;
    // A targeted refresh can supersede one resource without discarding the
    // independent resources (or their errors) from this global read.
    const ownsResult = [rolesRevision === rolesReadRevision.current, groupsRevision === groupsReadRevision.current, sessionsRevision === sessionsReadRevision.current, sessionsRevision === sessionsReadRevision.current];
    if (ownsResult[0] && results[0].status === "fulfilled") setRoles(results[0].value);
    if (ownsResult[1] && results[1].status === "fulfilled") setGroups(results[1].value);
    if (ownsResult[2] && results[2].status === "fulfilled") setActiveSessions(results[2].value);
    if (ownsResult[3] && results[3].status === "fulfilled") setSessionHistory(results[3].value);
    const failures = results.filter((_result, index) => ownsResult[index]).filter((result): result is PromiseRejectedResult => result.status === "rejected").map((result) => result.reason);
    setAuthRequired(failures.some((failure) => failure instanceof BffRequestError && failure.status === 401));
    if (failures.length > 0) setLoadError([...new Set(failures.map(administrationErrorMessage))].join(" "));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initial === undefined) void loadAll();
    return () => { allReadRevision.current += 1; rolesReadRevision.current += 1; groupsReadRevision.current += 1; sessionsReadRevision.current += 1; };
  }, [loadAll, initial]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const page = document;
    const refresh = () => { if (!page.hidden && !loading && !actionPending.current) void loadAll(); };
    return subscribePageReturn(refresh);
  }, [loadAll, loading]);

  const runAction = useCallback(async (key: string, successMessage: string, action: () => Promise<unknown>, refresh?: () => Promise<unknown>) => {
    // State alone cannot protect two submissions before React renders again.
    if (actionPending.current) return false;
    actionPending.current = true;
    setBusyAction(key);
    setActionError(null);
    setNotice(null);
    if (key !== "retry-refresh") setRefreshFailure(null);
    try {
      await action();
      // A confirmed mutation also invalidates a seed whose panel was never opened.
      mutationConfirmed.current();
      setNotice(successMessage);
      if (refresh) {
        try { await refresh(); }
        catch (error) {
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
  }, []);

  const confirmRoleDeletion = useCallback((roleId: number) => {
    // A confirmed DELETE is authoritative even if the follow-up GET fails.
    rolesReadRevision.current += 1;
    setRoles((current) => current?.filter((role) => role.id !== roleId) ?? null);
  }, []);
  const refreshRoles = useCallback(async () => {
    const revision = ++rolesReadRevision.current;
    try { const current = await administrationApi.listRoles(); if (revision === rolesReadRevision.current) setRoles(current); }
    catch (error) { if (revision === rolesReadRevision.current) throw error; }
  }, []);
  const refreshGroups = useCallback(async () => {
    const revision = ++groupsReadRevision.current;
    try { const current = await administrationApi.listGroups(); if (revision === groupsReadRevision.current) setGroups(current); }
    catch (error) { if (revision === groupsReadRevision.current) throw error; }
  }, []);
  const applyGroupDeletion = useCallback((groupId: number) => {
    groupsReadRevision.current += 1;
    setGroups((current) => current?.filter((group) => group.id !== groupId) ?? null);
  }, []);
  const refreshSessions = useCallback(async () => {
    const revision = ++sessionsReadRevision.current;
    // Both reads own the pending command until they settle, even if one fails early.
    const [current, history] = await Promise.allSettled([administrationApi.listActiveSessions(), administrationApi.listSessionHistory()]);
    if (revision !== sessionsReadRevision.current) return;
    if (current.status === "fulfilled") setActiveSessions(current.value);
    if (history.status === "fulfilled") setSessionHistory(history.value);
    if (current.status === "rejected") throw current.reason;
    if (history.status === "rejected") throw history.reason;
  }, []);

  return {
    roles, groups, activeSessions, sessionHistory, loading, busyAction, refreshFailure, loadError, actionError, notice, authRequired,
    clearNotice: () => setNotice(null), clearActionError: () => setActionError(null),
    loadAll, runAction, confirmRoleDeletion, refreshRoles, refreshGroups, applyGroupDeletion, refreshSessions,
  };
}
