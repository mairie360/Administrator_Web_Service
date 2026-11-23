"use client";
import { Button, DataTable, Panel, StatusPill, UserIdentity, formatDateTime, type DataTableColumn } from "@mairie360/lib-components/primitives";

import type { SecurityAlert } from '@/lib/administration-api';
import { deviceOf, maskIpAddress } from './security-display';

export interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  state: "loading" | "default" | "unavailable";
  onRetry: () => void;
  onOpenJournal: (alert: SecurityAlert) => void;
}

/** A3 (MAIR-773): « Alertes de sécurité récentes », the uses of a session from another device over the last 30 days. */
export function SecurityAlerts({ alerts, state, onRetry, onOpenJournal }: SecurityAlertsProps) {
  const columns: DataTableColumn<SecurityAlert>[] = [
    { key: "date", header: "Date", cell: (alert) => formatDateTime(alert.createdAt, "medium") ?? "Inconnue" },
    { key: "agent", header: "Agent", kind: "content", cell: (alert) => <UserIdentity name={`${alert.user.firstName} ${alert.user.lastName}`} size="s" /> },
    {
      key: "level", header: "Niveau", kind: "content",
      cell: (alert) => alert.level === "certain"
        ? <StatusPill label="Tentative certaine" tone="danger" size="s" />
        : <StatusPill label="Tentative possible" tone="warning" size="s" />,
    },
    { key: "device", header: "Appareil et adresse IP", cell: (alert) => `${deviceOf(alert.deviceInfo)} · ${maskIpAddress(alert.ipAddress)}` },
    {
      key: "actions", header: "Actions", hideHeader: true, kind: "actions",
      cell: (alert) => <Button size="s" variant="ghost" label="Voir le journal" aria-label={`Voir le journal des connexions de ${alert.user.firstName} ${alert.user.lastName}`} onClick={() => onOpenJournal(alert)} />,
    },
  ];
  const tableState = state === "loading" ? "loading" : alerts.length === 0 ? "empty" : "default";
  return (
    <Panel className="administration-panel" title="Alertes de sécurité récentes" description="Utilisations d’une session depuis un autre appareil, sur les 30 derniers jours." flush
      state={state === "unavailable" ? "unavailable" : "default"} stateProps={{ title: "Les alertes n’ont pas pu être chargées.", onRetry }}>
      <DataTable<SecurityAlert> label="Alertes de sécurité récentes" columns={columns} rows={alerts} rowKey={(alert) => String(alert.id)} state={tableState} skeletonRows={4}
        stateProps={{ title: "Aucune alerte ces 30 derniers jours." }} />
    </Panel>
  );
}
