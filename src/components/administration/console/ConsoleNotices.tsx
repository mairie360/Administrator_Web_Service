"use client";
import { KeyRound } from "lucide-react";
import { ErrorAlert, Toast, WarningAlert } from "@mairie360/lib-components/primitives";

import { ActionButton } from "../shared/controls";
import type { RefreshFailure } from "./use-administration-data";

export interface ConsoleNoticesProps {
  authRequired: boolean;
  loadError: string | null;
  notice: string | null;
  actionError: string | null;
  refreshFailure: RefreshFailure | null;
  busyAction: string | null;
  onCloseNotice: () => void;
  onCloseError: () => void;
  onRetryRefresh: () => void;
}

/** Session expired, partial read failure, write receipt / refusal, and the « saved but not refreshed » recovery. */
export const ConsoleNotices = ({ authRequired, loadError, notice, actionError, refreshFailure, busyAction, onCloseNotice, onCloseError, onRetryRefresh }: ConsoleNoticesProps) => (
  <>
    {authRequired && <ErrorAlert role="alert" icon={KeyRound} title="Session administrateur requise" description="Votre session a expiré. Reconnectez-vous pour accéder à l’administration." />}
    {loadError && !authRequired && <ErrorAlert role="alert" title="Certaines données n’ont pas pu être chargées" description={loadError} />}
    {notice && <Toast message={notice} tone="success" onClose={onCloseNotice} />}
    {actionError && <Toast message={actionError} tone="danger" onClose={onCloseError} />}
    {refreshFailure && (
      <WarningAlert role="alert" title="L’action est enregistrée, mais les données n’ont pas pu être actualisées."
        description={<>{refreshFailure.message} Ne répétez pas l’action.<span className="mt-3 block"><ActionButton variant="secondary" busy={busyAction === "retry-refresh"} disabled={busyAction !== null} onClick={onRetryRefresh}>Réessayer l’actualisation</ActionButton></span></>} />
    )}
  </>
);
