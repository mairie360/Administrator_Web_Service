"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@mairie360/lib-components/primitives";

import { administrationApi, type AdministrationUser, type AdministrationUsersPage, type TwoFactorPolicy } from '@/lib/administration-api';
import { type RunAction } from '../../types';
import { TwoFactorPolicyForm } from './components/TwoFactorPolicyForm';
import { AgentsTwoFactor } from './components/AgentsTwoFactor';

const AGENTS_PAGE_SIZE = 10;

/**
 * « Sécurité » tab (MAIR-824, Administrator part of MAIR-809): A1 the second-factor policy of the mairie,
 * A2 the agents with their method and last verification, and the reset of their second factor.
 */
export function SecurityPanel({ busyAction, runAction }: { busyAction: string | null; runAction: RunAction }) {
  const [policy, setPolicy] = useState<TwoFactorPolicy | null>(null);
  const [policyState, setPolicyState] = useState<"loading" | "default" | "unavailable">("loading");
  const [agents, setAgents] = useState<AdministrationUsersPage | null>(null);
  const [agentsState, setAgentsState] = useState<"loading" | "default" | "error">("loading");
  const [agentsPage, setAgentsPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<AdministrationUser | null>(null);
  const agentsRevision = useRef(0);

  const loadPolicy = useCallback(async () => {
    setPolicyState("loading");
    try { setPolicy(await administrationApi.getTwoFactorPolicy()); setPolicyState("default"); }
    catch { setPolicyState("unavailable"); }
  }, []);
  const loadAgents = useCallback(async () => {
    const revision = ++agentsRevision.current;
    setAgentsState("loading");
    try {
      const received = await administrationApi.listUsers({ page: agentsPage, pageSize: AGENTS_PAGE_SIZE, status: "active" });
      if (revision !== agentsRevision.current) return;
      setAgents(received);
      setAgentsState("default");
    } catch {
      if (revision === agentsRevision.current) setAgentsState("error");
    }
  }, [agentsPage]);
  useEffect(() => { void loadPolicy(); }, [loadPolicy]);
  useEffect(() => { void loadAgents(); return () => { agentsRevision.current += 1; }; }, [loadAgents]);

  const savePolicy = (next: TwoFactorPolicy) => void runAction("save-two-factor-policy", "Politique de double authentification enregistrée", async () => {
    setPolicy(await administrationApi.updateTwoFactorPolicy(next));
  });
  const confirmReset = () => {
    if (!resetTarget) return;
    const user = resetTarget;
    void runAction(`reset-two-factor-${user.id}`, `Double authentification de ${user.first_name} ${user.last_name} réinitialisée`,
      () => administrationApi.resetUserTwoFactor(user.id), loadAgents)
      .then((success) => { if (success) setResetTarget(null); });
  };

  return (
    <div className="min-w-0 space-y-5">
      <TwoFactorPolicyForm policy={policy} state={policyState} saving={busyAction === "save-two-factor-policy"} onRetry={() => void loadPolicy()} onSave={savePolicy} />
      <AgentsTwoFactor page={agents} state={agentsState} locked={busyAction !== null} onPage={setAgentsPage} onRetry={() => void loadAgents()} onReset={setResetTarget} />
      <ConfirmModal role="alertdialog" open={resetTarget !== null} destructive={false} title="Réinitialiser la double authentification ?"
        message={resetTarget ? `Le second facteur de ${resetTarget.first_name} ${resetTarget.last_name} sera supprimé et toutes ses sessions fermées. Il devra en configurer un nouveau${policy?.required ? " à sa prochaine connexion" : ""}.` : ""}
        confirmLabel="Réinitialiser" busy={resetTarget !== null && busyAction === `reset-two-factor-${resetTarget.id}`}
        onCancel={() => setResetTarget(null)} onConfirm={confirmReset} />
    </div>
  );
}
