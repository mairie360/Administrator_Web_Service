"use client";
import { SegmentedControl } from "@mairie360/lib-components/primitives";
import { Clock3, History } from "lucide-react";

export type SessionsView = "active" | "history";

/** Active / history switch with the counts (Figma Base/SegmentedControl). */
export const SessionsViewSwitch = ({ view, onChange, activeCount, historyCount }: { view: SessionsView; onChange: (view: SessionsView) => void; activeCount?: number; historyCount?: number }) => (
  <SegmentedControl label="Sessions affichées" className="mb-5" value={view} onChange={onChange} options={[
    { key: "active", label: `Actives (${activeCount ?? "—"})`, icon: Clock3 },
    { key: "history", label: `Historique (${historyCount ?? "—"})`, icon: History },
  ]} />
);
