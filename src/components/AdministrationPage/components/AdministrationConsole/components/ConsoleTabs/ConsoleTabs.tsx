"use client";
import { Tabs } from "@mairie360/lib-components/primitives";

import { administrationTabs, type AdministrationTabCounts, type AdministrationTabId } from './console-tabs';

/** The three sections on the lib `Tabs`, each with its count once read, locked while a write runs. */
export const ConsoleTabs = ({ value, locked, counts = {}, onChange }: { value: AdministrationTabId; locked: boolean; counts?: AdministrationTabCounts; onChange: (tab: AdministrationTabId) => void }) => (
  <Tabs id="administration" label="Sections d’administration" value={value} onChange={onChange}
    items={administrationTabs.map(({ id, label, icon }) => {
      const count = counts[id];
      return { key: id, label, icon, disabled: locked, ...(typeof count === "number" ? { count } : {}) };
    })} />
);
