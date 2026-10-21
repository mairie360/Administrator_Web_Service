/**
 * Name and e-mail of a member or a candidate. A render helper (not a component) so the
 * text stays part of the row it sits in: the row keeps its accessible content and search-by-text.
 */
export const memberIdentity = ({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) => (
  <span className="min-w-0">
    <span className="block truncate text-sm font-bold text-[var(--mairie-text)]">{firstName} {lastName}</span>
    <span className="block truncate text-xs text-[var(--mairie-muted)]">{email}</span>
  </span>
);
