"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, CreateButton, Panel } from "@mairie360/lib-components/primitives";
import { administrationApi, type AdministrationService } from '@/lib/administration-api';
import { type RunAction } from '../../types';
import { ServicesTable } from './components/ServicesTable';
import { ServiceModal } from './components/ServiceModal';

/**
 * « Services » tab (MAIR-923): the services of the mairie an agent belongs to, with their agents; creation
 * (« Nouveau service »), renaming (a click on the row or its pencil) and deletion, confirmed, which leaves
 * the agents of the service without one.
 */
export function ServicesPanel({ busyAction, runAction }: { busyAction: string | null; runAction: RunAction }) {
  const locked = busyAction !== null;
  const [services, setServices] = useState<AdministrationService[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AdministrationService | "new" | null>(null);
  const [deletion, setDeletion] = useState<AdministrationService | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setServices(await administrationApi.listServices()); }
    catch { setServices(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = (name: string) => {
    if (target === null) return Promise.resolve(false);
    if (target === "new") return runAction("save-service", "Service créé.", () => administrationApi.createService(name), load);
    return runAction("save-service", "Service renommé.", () => administrationApi.renameService(target.id, name), load);
  };
  const confirmDeletion = () => {
    if (!deletion) return;
    void runAction(`delete-service-${deletion.id}`, "Service supprimé.", () => administrationApi.deleteService(deletion.id), load)
      .then((success) => { if (success) setDeletion(null); });
  };

  return (
    <>
      <Panel className="administration-panel" title="Services" description="Services de la mairie auxquels les agents sont rattachés." flush
        action={<CreateButton label="Nouveau service" disabled={locked} onClick={() => setTarget("new")} />}>
        <ServicesTable services={services} loading={loading} locked={locked} onRename={setTarget} onDelete={setDeletion} onRetry={() => void load()} />
      </Panel>
      <ServiceModal target={target} services={services ?? []} saving={busyAction === "save-service"} onClose={() => setTarget(null)} onSave={save} />
      <ConfirmModal role="alertdialog" open={deletion !== null} title="Supprimer le service ?" confirmLabel="Supprimer"
        message={deletion ? (deletion.agents > 0
          ? `Le service « ${deletion.name} » compte ${deletion.agents} agent${deletion.agents > 1 ? "s" : ""}, qui ne seront plus rattachés à aucun service.`
          : `Le service « ${deletion.name} » sera définitivement supprimé.`) : ""}
        busy={deletion !== null && busyAction === `delete-service-${deletion.id}`}
        onCancel={() => setDeletion(null)} onConfirm={confirmDeletion} />
    </>
  );
}
