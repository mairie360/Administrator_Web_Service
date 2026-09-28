"use client";

import { AppShell } from "@mairie360/lib-components";
import { AdministrationConsole } from "@/components/administration-console";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import { getActiveFrontHrefs } from "@/lib/navigation";

export default function Home() {
  const session = useAuthSession();
  const hrefs = getActiveFrontHrefs();

  return (
    <AppShell
      activeItem="admin"
      isAdmin={session.isAdmin}
      user={session.user}
      onLogout={() => void logoutAndReload()}
      hrefs={hrefs}
    >
      <div className="min-w-0 w-full">
        <AdministrationConsole />
      </div>
    </AppShell>
  );
}
