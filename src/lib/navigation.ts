import { parseFrontUrl } from "@mairie360/lib-components/shared";
import { frontUrl, type FrontUrlKey } from "./front-urls";
import { settingsProfileUrl } from "./settings-profile";

const configuredUrl = (key: FrontUrlKey) => parseFrontUrl(frontUrl(key))?.href;

/** Shell entries and the module of the role (MAIR-916) each one needs; the profile stays reachable whatever the role. */
const MODULE_OF = { dashboard: "dashboard", projects: "projects", messages: "messages", training: "training", calendar: "calendar", admin: "admin", settings: "settings" } as const;

/**
 * Only validated, active frontend destinations reach the shared shell, and, once the session tells them (MAIR-916),
 * only the modules its role opens: the shell hides an entry without destination. Without `modules` every entry stays.
 */
export function getActiveFrontHrefs(modules?: readonly string[]) {
  const hrefs = frontHrefs();
  if (!modules) return hrefs;
  const opened = new Set(modules);
  return Object.fromEntries(Object.entries(hrefs).map(([entry, href]) => {
    const needed = MODULE_OF[entry as keyof typeof MODULE_OF];
    return [entry, needed === undefined || opened.has(needed) ? href : undefined];
  })) as typeof hrefs;
}

function frontHrefs() {
  const settings = settingsProfileUrl(frontUrl("SETTINGS_FRONT_URL"));
  return {
    dashboard: configuredUrl("DASHBOARD_FRONT_URL"),
    projects: configuredUrl("PROJECT_FRONT_URL"),
    messages: configuredUrl("MESSAGE_FRONT_URL"),
    training: configuredUrl("ELEARNING_FRONT_URL"),
    calendar: configuredUrl("CALENDAR_FRONT_URL"),
    admin: configuredUrl("ADMINISTRATION_FRONT_URL") ?? "/",
    profile: settings,
    settings,
  };
}
