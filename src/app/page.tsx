"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Footer,
  Header,
  Sidebar,
} from "@mairie360/lib-components";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import { AdministrationConsole } from "@/components/administration-console";
import { adminUser } from "@/lib/current-user";
import { navigateToPage } from "@/lib/navigation";
import { sidebarItems } from "@/lib/sidebar-items";

export default function Home() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = useAuthSession(adminUser);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
  };

  const handleSidebarItemSelect = (item: { id: string }) => {
    handlePageChange(item.id);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f5f3f0] text-[#172033]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar
          activeItem="admin"
          isAdmin={session.isAdmin}
          items={sidebarItems}
          brandLogoSrc={null}
          onItemSelect={handleSidebarItemSelect}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            className="absolute inset-0 bg-black/45"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              activeItem="admin"
              isAdmin={session.isAdmin}
              items={sidebarItems}
              brandLogoSrc={null}
              onItemSelect={handleSidebarItemSelect}
            />
          </div>
        </div>
      )}

      <div className="flex h-screen min-w-0 flex-col lg:pl-[260px]">
        <Header
          user={session.user}
          isAdmin={session.isAdmin}
          setSidebarOpen={setSidebarOpen}
          profileHref="/profile"
          onPageChange={handlePageChange}
          onLogout={() => void logoutAndReload()}
        />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1520px]">
            <AdministrationConsole />
          </div>
        </main>

        <Footer version="2.1.0" />
      </div>
    </div>
  );
}
