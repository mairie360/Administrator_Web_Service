"use client";
import { DataTable, Modal, formatDateTime, type DataTableColumn } from "@mairie360/lib-components/primitives";

import type { ConnectionLog } from '@/lib/administration-api';
import { deviceOf, maskIpAddress } from '../SecurityAlerts';

const eventLabels: Record<string, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  REFRESH: "Renouvellement de session",
  EXPIRED: "Session expirée",
  CLEANUP: "Nettoyage",
  IP_CHANGE: "Changement de réseau",
  SUSPICIOUS_IP_CHANGE: "Changement de réseau suspect",
  STOLEN_SESSION_ATTEMPT: "Tentative de vol de session",
};

/** The French name of an event of the journal, the raw action for an unknown one. */
export const eventLabel = (action: string) => eventLabels[action] ?? action;

type JournalRow = ConnectionLog & { position: number };

export interface ConnectionLogModalProps {
  agentName: string;
  logs: ConnectionLog[];
  state: "loading" | "default" | "unavailable";
  onRetry: () => void;
  onClose: () => void;
}

/** A3 (MAIR-773): « Journal des connexions — <agent> », opened from an alert or from the link of the alert e-mail. */
export function ConnectionLogModal({ agentName, logs, state, onRetry, onClose }: ConnectionLogModalProps) {
  const columns: DataTableColumn<JournalRow>[] = [
    { key: "date", header: "Date", cell: (line) => (line.occurredAt ? formatDateTime(line.occurredAt, "medium") : null) ?? "Inconnue" },
    { key: "event", header: "Événement", cell: (line) => eventLabel(line.action) },
    { key: "device", header: "Appareil", cell: (line) => deviceOf(line.deviceInfo) },
    { key: "ip", header: "Adresse IP", cell: (line) => maskIpAddress(line.ipAddress) },
  ];
  // Two lines of the journal can share their date and event: the position keys them.
  const rows: JournalRow[] = logs.map((line, position) => ({ ...line, position }));
  const tableState = state === "loading" ? "loading" : state === "unavailable" ? "error" : logs.length === 0 ? "empty" : "default";
  return (
    <Modal open title={`Journal des connexions — ${agentName}`} size="l" onClose={onClose} closeLabel="Fermer le journal">
      <DataTable<JournalRow> label={`Journal des connexions de ${agentName}`} columns={columns} rows={rows} rowKey={(line) => String(line.position)} state={tableState} skeletonRows={5}
        stateProps={tableState === "error" ? { title: "Le journal n’a pas pu être chargé.", onRetry } : { title: "Aucune connexion enregistrée." }} />
    </Modal>
  );
}
