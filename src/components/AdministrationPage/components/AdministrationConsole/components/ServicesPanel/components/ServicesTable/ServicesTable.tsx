"use client";
import { DataTable, DeleteIconButton, EditIconButton, type DataTableColumn } from "@mairie360/lib-components/primitives";

import type { AdministrationService } from '@/lib/administration-api';

export interface ServicesTableProps {
  services: AdministrationService[] | null;
  loading: boolean;
  locked: boolean;
  onRename: (service: AdministrationService) => void;
  onDelete: (service: AdministrationService) => void;
  onRetry: () => void;
}

const agentsLabel = (count: number) => count === 0 ? "Aucun agent" : `${count} agent${count > 1 ? "s" : ""}`;

/** MAIR-923: the services of the mairie with their agents; the row or its pencil renames, « Supprimer » keeps its own click. */
export function ServicesTable({ services, loading, locked, onRename, onDelete, onRetry }: ServicesTableProps) {
  const columns: DataTableColumn<AdministrationService>[] = [
    { key: "name", header: "Service", kind: "strong", cell: (service) => service.name },
    { key: "agents", header: "Agents", cell: (service) => agentsLabel(service.agents) },
    {
      key: "actions", header: "Actions", hideHeader: true, kind: "actions",
      cell: (service) => (
        <span className="inline-flex gap-1">
          <EditIconButton size="s" label={`Renommer le service ${service.name}`} disabled={locked} onClick={() => onRename(service)} />
          <DeleteIconButton size="s" label={`Supprimer le service ${service.name}`} disabled={locked} onClick={() => onDelete(service)} />
        </span>
      ),
    },
  ];
  const state = services === null ? (loading ? "loading" : "error") : services.length === 0 ? "empty" : "default";
  return (
    <DataTable<AdministrationService> label="Services" columns={columns} rows={services ?? []} rowKey={(service) => String(service.id)} state={state} skeletonRows={4}
      onRowClick={locked ? undefined : onRename} rowLabel={(service) => `Renommer le service ${service.name}`}
      stateProps={state === "error" ? { title: "Les services n’ont pas pu être chargés.", onRetry } : { title: "Aucun service pour le moment." }} />
  );
}
