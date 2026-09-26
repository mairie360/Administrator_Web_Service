"use client";

import { AppShell } from "@mairie360/lib-components";
import { AdministrationConsole } from "@/components/administration-console";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import { frontUrl } from "@/lib/front-urls";

export default function Home() {
  const session = useAuthSession();
  const settingsUrl = frontUrl("SETTINGS_FRONT_URL");
  const hrefs = {
    dashboard: frontUrl("DASHBOARD_FRONT_URL"),
    projects: frontUrl("PROJECT_FRONT_URL"),
    messages: frontUrl("MESSAGE_FRONT_URL"),
    training: frontUrl("ELEARNING_FRONT_URL"),
    calendar: frontUrl("CALENDAR_FRONT_URL"),
    admin: frontUrl("ADMINISTRATION_FRONT_URL") ?? "/",
    profile: settingsUrl,
    settings: settingsUrl,
  };

  return (
    <AppShell
      activeItem="admin"
      isAdmin={session.isAdmin}
      user={session.user}
      onLogout={() => void logoutAndReload()}
      hrefs={hrefs}
    >
      <div className="mx-auto max-w-[1520px]">
        <AdministrationConsole />
      </div>
    </AppShell>
  );
}
