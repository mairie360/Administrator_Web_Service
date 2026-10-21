"use client";
import { useEffect, useState } from "react";

import { administrationApi, type AdministrationGroup, type AdministrationUser } from "@/lib/administration-api";
import { administrationErrorMessage } from "@/lib/administration-error";

/** Users matching the member search of the open group, read 250 ms after the last keystroke. */
export function useMemberCandidates(selectedGroup: AdministrationGroup | null, search: string) {
  const [options, setOptions] = useState<AdministrationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedGroup) { setOptions([]); return; }
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await administrationApi.listUsers({ page: 1, search });
        if (!cancelled) setOptions(result.users);
      } catch (reason) {
        if (!cancelled) setError(administrationErrorMessage(reason));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [search, selectedGroup]);
  return { options, loading, error };
}
