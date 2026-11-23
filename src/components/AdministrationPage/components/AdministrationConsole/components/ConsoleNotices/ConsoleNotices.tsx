"use client";
import { KeyRound } from "lucide-react";
import { Button, ErrorAlert, Toast, WarningAlert } from "@mairie360/lib-components/primitives";

import { ActionButton } from '@/components/AdministrationPage/components/ActionButton';
import type { RefreshFailure } from '../../use-administration-data';

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
  /** F13: « Se reconnecter » (MAIR-910). */
  onReconnect: () => void;
  reconnecting: boolean;
}

/** Session expired, partial read failure, write receipt / refusal, and the « saved but not refreshed » recovery. */
export const ConsoleNotices = ({ authRequired, loadError, notice, actionError, refreshFailure, busyAction, onCloseNotice, onCloseError, onRetryRefresh, onReconnect, reconnecting }: ConsoleNoticesProps) => (
  <>
    {/* F13: not dismissable; the data stays readable, every write is refused until the session is back. */}
    {authRequired && (
      <WarningAlert role="alert" icon={KeyRound} title="Session administrateur requise"
        description={<>Reconnectez-vous pour enregistrer des modifications.<span className="mt-3 block"><Button variant="outline" tone="neutral" size="s" loading={reconnecting} onClick={onReconnect}>Se reconnecter</Button></span></>} />
    )}
    {loadError && !authRequired && <ErrorAlert role="alert" title="Certaines données n’ont pas pu être chargées" description={loadError} />}
    {/* F10: a suspension closes every session, a warning; every other receipt is a success. */}
    {notice && <Toast message={notice} tone={notice.startsWith("Compte suspendu") || notice.startsWith("Reconnectez-vous") ? "warning" : "success"} onClose={onCloseNotice} />}
    {actionError && <Toast message={actionError} tone="danger" onClose={onCloseError} />}
    {refreshFailure && (
      <WarningAlert role="alert" title="L’action est enregistrée, mais les données n’ont pas pu être actualisées."
        description={<>{refreshFailure.message} Ne répétez pas l’action.<span className="mt-3 block"><ActionButton variant="secondary" busy={busyAction === "retry-refresh"} disabled={busyAction !== null} onClick={onRetryRefresh}>Réessayer l’actualisation</ActionButton></span></>} />
    )}
  </>
);
