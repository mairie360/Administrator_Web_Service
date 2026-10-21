"use client";
import { Tabs } from "@mairie360/lib-components/primitives";

import { administrationTabs, type AdministrationTabId } from "./console-tabs";

/** The four sections on the lib `Tabs`, locked while a write runs. */
export const ConsoleTabs = ({ value, locked, onChange }: { value: AdministrationTabId; locked: boolean; onChange: (tab: AdministrationTabId) => void }) => (
  <Tabs id="administration" label="Sections d’administration" value={value} onChange={onChange}
    items={administrationTabs.map(({ id, label, icon }) => ({ key: id, label, icon, disabled: locked }))} />
);
