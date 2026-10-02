import type { AdministrationSession } from "./administration-api";

type SessionDates = Pick<AdministrationSession, "expires_at" | "revoked_at">;
export type AdministrationSessionState = "active" | "expired" | "revoked" | "unknown";

export function administrationSessionState(session: SessionDates, now: number): AdministrationSessionState {
  if (session.revoked_at) return "revoked";
  const expiry = session.expires_at ? Date.parse(session.expires_at) : NaN;
  if (!Number.isFinite(expiry)) return "unknown";
  return expiry <= now ? "expired" : "active";
}

/** One timer for the table, not a polling timer per row or an extra BFF request. */
export function nextSessionExpiryDelay(sessions: readonly SessionDates[], now: number): number | null {
  let earliest = Infinity;
  for (const session of sessions) {
    if (session.revoked_at) continue;
    const expiry = session.expires_at ? Date.parse(session.expires_at) : NaN;
    if (expiry > now && expiry < earliest) earliest = expiry;
  }
  return Number.isFinite(earliest) ? Math.min(earliest - now + 1, 2_147_483_647) : null;
}
