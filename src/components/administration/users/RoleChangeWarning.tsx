"use client";
import { WarningAlert } from "@mairie360/lib-components/primitives";

/** Role writes are independent: which ones were confirmed and what remains to retry. */
export const RoleChangeWarning = ({ messages }: { messages: string[] }) => (
  <WarningAlert role="alert" size="s" title="Les changements de rôle ne sont pas tous confirmés."
    description={<>{messages.map((message) => <span key={message} className="mt-1 block">{message}</span>)}<span className="mt-2 block">La fiche et le tableau conservent les changements confirmés. Vérifiez la sélection puis enregistrez pour reprendre uniquement les changements restants.</span></>} />
);
