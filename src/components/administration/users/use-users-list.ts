"use client";
import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { administrationApi, type AdministrationUsersPage } from "@/lib/administration-api";
import { administrationErrorMessage } from "@/lib/administration-error";
import { usersUrlSchema } from "@/lib/administration-query";
import { subscribePageReturn } from "@/lib/page-return";
import { usePageUrlState } from "@/lib/use-page-url-state";

export const emptyUsersPage: AdministrationUsersPage = { users: [], page: 1, page_size: 20, total: 0, total_pages: 0 };

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
  searchInput: string;
  usersLoading: boolean;
  setUsersLoading: (loading: boolean) => void;
  usersError: string | null;
  usersMutationConfirmed: boolean;
  /** A confirmed write invalidates earlier reads and the displayed totals until the next GET. */
  confirmMutation: () => void;
  /** Invalidates earlier reads without marking a mutation (independent confirmed writes). */
  invalidateReads: () => void;
  loadUsers: () => Promise<void>;
  typeSearch: (value: string) => void;
  submitSearch: (event: FormEvent<HTMLFormElement>) => void;
  changePage: (direction: number) => void;
}

/**
 * The paginated users read: URL-backed page and search (debounced 250 ms), one read at a time,
 * a seed from the server render, page-return refresh, and the « to refresh » state after a write.
 */
export function useUsersList({ initialPage, initialError, initialSearch, onInitialReadConsumed, onTotalChange, busyAction }: UsersListOptions): UsersList {
  const [initial] = useState(() => ({ page: initialPage, error: initialError, search: initialSearch }));
  const [usersPage, setUsersPage] = useState<AdministrationUsersPage>(initial.page ?? emptyUsersPage);
  const [hasReceivedUsers, setHasReceivedUsers] = useState(Boolean(initial.page));
  const pageUrl = usePageUrlState(usersUrlSchema, initial.search);
  const page = Number(pageUrl.state.usersPage);
  const search = pageUrl.state.usersSearch;
  const [searchInput, setSearchInput] = useState(pageUrl.state.usersSearch);
  const usersReadController = useRef<AbortController | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (pageUrl.ready) setSearchInput(search);
  }, [pageUrl.ready, search]);
  const [usersLoading, setUsersLoading] = useState(initial.page === undefined);
  const [usersError, setUsersError] = useState<string | null>(initial.error ?? null);
  const [usersMutationConfirmed, setUsersMutationConfirmed] = useState(false);
  const usersReadRevision = useRef(0);

  const loadUsers = useCallback(async () => {
    usersReadController.current?.abort();
    const controller = new AbortController();
    usersReadController.current = controller;
    const revision = ++usersReadRevision.current;
    const isCurrent = () => !controller.signal.aborted && usersReadRevision.current === revision;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await administrationApi.listUsers({ page, search }, controller.signal);
      if (!isCurrent()) return;
      setUsersPage(response);
      setHasReceivedUsers(true);
      setUsersMutationConfirmed(false);
      onTotalChange(response.total);
      if (response.total_pages > 0 && page > response.total_pages) pageUrl.update({ usersPage: String(response.total_pages) }, "replace");
    } catch (error) {
      if (isCurrent()) setUsersError(administrationErrorMessage(error));
    } finally {
      if (isCurrent()) setUsersLoading(false);
    }
  }, [onTotalChange, page, search, pageUrl.update]);

  const skipInitialRead = useRef(initial.page !== undefined);
  useEffect(() => {
    if (!pageUrl.ready) return;
    const initialQuery = new URLSearchParams(initial.search ?? "");
    if (skipInitialRead.current) {
      if (page === Number(initialQuery.get("usersPage") ?? 1) && search === (initialQuery.get("usersSearch") ?? "")) {
        // Replay of the same mount effect still owns this confirmed query.
        // The parent consumes the seed for a later genuine panel remount.
        onInitialReadConsumed?.();
        return;
      }
      skipInitialRead.current = false;
    }
    void loadUsers();
    return () => { usersReadRevision.current += 1; usersReadController.current?.abort(); };
  }, [loadUsers, pageUrl.ready, initial, page, search, onInitialReadConsumed]);

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const browserPage = document;
    const refresh = () => { if (!browserPage.hidden && pageUrl.ready && busyAction === null) void loadUsers(); };
    return subscribePageReturn(refresh);
  }, [loadUsers, pageUrl.ready, busyAction]);

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
    // Invalidate at submission, before the effect starts the replacement read.
    usersReadRevision.current += 1;
    pageUrl.update({ usersSearch: nextSearch, usersPage: "1" });
  };
  const changePage = (direction: number) => {
    usersReadRevision.current += 1;
    pageUrl.update({ usersPage: String(Math.max(1, page + direction)) });
  };
  const confirmMutation = () => { usersReadRevision.current += 1; setUsersMutationConfirmed(true); onTotalChange(null); };
  const invalidateReads = () => { usersReadRevision.current += 1; };

  return { usersPage, setUsersPage, hasReceivedUsers, page, search, searchInput, usersLoading, setUsersLoading, usersError, usersMutationConfirmed, confirmMutation, invalidateReads, loadUsers, typeSearch, submitSearch, changePage };
}
