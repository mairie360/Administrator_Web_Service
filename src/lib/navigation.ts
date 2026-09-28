import { parseFrontUrl } from "./front-url";
import { frontUrl, type FrontUrlKey } from "./front-urls";
import { settingsProfileUrl } from "./settings-profile";

const configuredUrl = (key: FrontUrlKey) => parseFrontUrl(frontUrl(key))?.href;

/** Only validated, active frontend destinations reach the shared shell. */
export function getActiveFrontHrefs() {
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
