"use client";

import { useEffect, useRef, useState } from "react";
import { administrationUrlSchema, usersUrlSchema } from '@/lib/administration-query';
import { usePageUrlState } from '@/lib/use-page-url-state';

// Module-level so the URL subscription stays stable across renders.
const headerSearchSchema = { ...administrationUrlSchema, ...usersUrlSchema };

/** Debounce of a keystroke in the header search, the same as the users list's own search. */
export const HEADER_SEARCH_DELAY = 250;

export interface HeaderSearch {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
}

/**
 * The search of the shared header: BFF User serves no global `/search`, so the field searches the agents.
 * Typing opens the « Utilisateurs » tab on the matching accounts (the users search of the URL, page 1);
 * the field shows that search while the « Utilisateurs » tab is open.
 */
export function useHeaderSearch(initialSearch?: string): HeaderSearch {
  const pageUrl = usePageUrlState(headerSearchSchema, initialSearch);
  const { tab, usersSearch } = pageUrl.state;
  const shown = tab === "users" ? usersSearch ?? "" : "";
  // What is typed stays shown while it is the source of the URL search (trailing spaces included); a search
  // changed elsewhere (the list's own field, another tab) replaces it.
  const [draft, setDraft] = useState<{ value: string; search: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // A URL change made elsewhere (a tab, the list's own field) while a keystroke waits cancels that keystroke:
  // it must not reopen « Utilisateurs » afterwards. The header's own change runs after its timer has fired.
  useEffect(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    setDraft(null);
  }, [tab, usersSearch]);
  const apply = (query: string, mode: "push" | "replace") => {
    setDraft({ value: query, search: query.trim() });
    pageUrl.update({ tab: "users", usersSearch: query.trim(), usersPage: "1" }, mode);
  };
  return {
    value: draft && draft.search === shown ? draft.value : shown,
    onChange: (query) => {
      setDraft({ value: query, search: shown });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { timer.current = null; apply(query, "replace"); }, HEADER_SEARCH_DELAY);
    },
    onSearch: (query) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      apply(query, "push");
    },
  };
}
