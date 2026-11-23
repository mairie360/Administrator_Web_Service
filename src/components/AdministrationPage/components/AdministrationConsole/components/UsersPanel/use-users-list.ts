"use client";
import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { administrationApi, USERS_PAGE_SIZE, type AccountStatus, type AdministrationUsersPage, type UsersSort } from '@/lib/administration-api';
import { administrationErrorMessage } from '@/lib/administration-error';
import { usersQueryOf, usersUrlSchema } from '@/lib/administration-query';
import { subscribePageReturn } from '@/lib/page-return';
import { usePageUrlState } from '@/lib/use-page-url-state';

export const emptyUsersPage: AdministrationUsersPage = { users: [], page: 1, page_size: USERS_PAGE_SIZE, total: 0, total_pages: 0 };

export interface UsersListOptions {
  initialPage?: AdministrationUsersPage | null;
  initialError?: string | null;
  initialSearch?: string;
  onInitialReadConsumed?: () => void;
  onTotalChange: (total: number | null) => void;
  busyAction: string | null;
}

export interface UsersList {
  usersPage: AdministrationUsersPage;
  setUsersPage: Dispatch<SetStateAction<AdministrationUsersPage>>;
  hasReceivedUsers: boolean;
  page: number;
  search: string;
  status: AccountStatus | "";
  roleId: number | null;
  sort: UsersSort;
  /** A search, a state or a role narrows the list (« Effacer les filtres »). */
  filtered: boolean;
  searchInput: string;
  usersLoading: boolean;
  setUsersLoading: (loading: boolean) => void;
  usersError: string | null;
  usersMutationConfirmed: boolean;
  /** A confirmed write invalidates earlier reads and the displayed totals until the next GET. */
  confirmMutation: () => void;
  /** Invalidates earlier reads without marking a mutation (independent confirmed writes). */
  invalidateReads: () => void;
  loadUsers: () => Promise<boolean>;
  typeSearch: (value: string) => void;
  submitSearch: (event: FormEvent<HTMLFormElement>) => void;
  /** F02 / F03 / F04: every filter or order change goes back to page 1. */
  setStatus: (status: AccountStatus | "") => void;
  setRole: (roleId: number | null) => void;
  setSort: (sort: UsersSort) => void;
  clearFilters: () => void;
  goToPage: (page: number) => void;
}

/**
 * The paginated users read (MAIR-904): URL-backed page, search (debounced 250 ms), state and role
 * filters and order by name, 6 rows per page, one read at a time, a seed from the server render,
 * page-return refresh, and the « to refresh » state after a write.
 */
export function useUsersList({ initialPage, initialError, initialSearch, onInitialReadConsumed, onTotalChange, busyAction }: UsersListOptions): UsersList {
  const [initial] = useState(() => ({ page: initialPage, error: initialError, search: initialSearch }));
  const [usersPage, setUsersPage] = useState<AdministrationUsersPage>(initial.page ?? emptyUsersPage);
  const [hasReceivedUsers, setHasReceivedUsers] = useState(Boolean(initial.page));
  const pageUrl = usePageUrlState(usersUrlSchema, initial.search);
  const query = usersQueryOf(pageUrl.state);
  const { search, roleId, sort } = query;
  const page = query.page ?? 1;
  const status = query.status ?? "";
  const [searchInput, setSearchInput] = useState(pageUrl.state.usersSearch);
  const usersReadController = useRef<AbortController | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (pageUrl.ready) setSearchInput(search ?? "");
  }, [pageUrl.ready, search]);
  const [usersLoading, setUsersLoading] = useState(initial.page === undefined);
  const [usersError, setUsersError] = useState<string | null>(initial.error ?? null);
  const [usersMutationConfirmed, setUsersMutationConfirmed] = useState(false);
  const usersReadRevision = useRef(0);
  const readKey = JSON.stringify({ page, search, status, roleId, sort });

  const loadUsers = useCallback(async () => {
    usersReadController.current?.abort();
    const controller = new AbortController();
    usersReadController.current = controller;
    const revision = ++usersReadRevision.current;
    const isCurrent = () => !controller.signal.aborted && usersReadRevision.current === revision;
    const current = JSON.parse(readKey) as { page: number; search: string; status: AccountStatus | ""; roleId: number | null; sort: UsersSort };
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await administrationApi.listUsers(current, controller.signal);
      if (!isCurrent()) return false;
      setUsersPage(response);
      setHasReceivedUsers(true);
      setUsersMutationConfirmed(false);
      // The « Utilisateurs » metric counts every account: a filtered page leaves it as it is.
      if (!current.search && !current.status && !current.roleId) onTotalChange(response.total);
      if (response.total_pages > 0 && current.page > response.total_pages) pageUrl.update({ usersPage: String(response.total_pages) }, "replace");
      return true;
    } catch (error) {
      if (isCurrent()) setUsersError(administrationErrorMessage(error));
      return false;
    } finally {
      if (isCurrent()) setUsersLoading(false);
    }
  }, [onTotalChange, readKey, pageUrl.update]);

  const skipInitialRead = useRef(initial.page !== undefined);
  useEffect(() => {
    if (!pageUrl.ready) return;
    if (skipInitialRead.current) {
      const seeded = usersQueryOf(Object.fromEntries(new URLSearchParams(initial.search ?? "")));
      if (JSON.stringify({ ...seeded, status: seeded.status ?? "" }) === readKey) {
        // Replay of the same mount effect still owns this confirmed query.
        // The parent consumes the seed for a later genuine panel remount.
        onInitialReadConsumed?.();
        return;
      }
      skipInitialRead.current = false;
    }
    void loadUsers();
    return () => { usersReadRevision.current += 1; usersReadController.current?.abort(); };
  }, [loadUsers, pageUrl.ready, initial, readKey, onInitialReadConsumed]);

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const browserPage = document;
    const refresh = () => { if (!browserPage.hidden && pageUrl.ready && busyAction === null) void loadUsers(); };
    return subscribePageReturn(refresh);
  }, [loadUsers, pageUrl.ready, busyAction]);

  const navigate = (patch: Record<string, string>, mode: "push" | "replace" = "push") => {
    // Invalidate at the change, before the effect starts the replacement read.
    usersReadRevision.current += 1;
    pageUrl.update({ usersPage: "1", ...patch }, mode);
  };
  const typeSearch = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => pageUrl.update({ usersSearch: value.trim(), usersPage: "1" }, "replace"), 250);
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const nextSearch = searchInput.trim();
    if (page === 1 && search === nextSearch) { void loadUsers(); return; }
    navigate({ usersSearch: nextSearch });
  };
  const clearFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchInput("");
    navigate({ usersSearch: "", usersStatus: "", usersRole: "" });
  };
  const confirmMutation = () => { usersReadRevision.current += 1; setUsersMutationConfirmed(true); onTotalChange(null); };
  const invalidateReads = () => { usersReadRevision.current += 1; };

  return {
    usersPage, setUsersPage, hasReceivedUsers, page, search: search ?? "", status, roleId: roleId ?? null, sort: sort ?? "name",
    filtered: Boolean(search || status || roleId), searchInput, usersLoading, setUsersLoading, usersError, usersMutationConfirmed,
    confirmMutation, invalidateReads, loadUsers, typeSearch, submitSearch,
    setStatus: (value) => navigate({ usersStatus: value }),
    setRole: (value) => navigate({ usersRole: value ? String(value) : "" }),
    setSort: (value) => navigate({ usersSort: value }),
    clearFilters,
    goToPage: (value) => { usersReadRevision.current += 1; pageUrl.update({ usersPage: String(Math.max(1, value)) }); },
  };
}
