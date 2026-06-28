"use client";

import { useState } from "react";
import {
  AdministrationModule,
  Footer,
  Header,
  Sidebar,
} from "@mairie360/lib-components";

const adminUser = {
  name: "Admin Système",
  email: "admin@mairie360.fr",
  role: "admin",
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#f5f3f0] text-[#172033]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar activeItem="admin" isAdmin brandLogoSrc={null} />
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
              isAdmin
              brandLogoSrc={null}
              onItemSelect={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex h-screen min-w-0 flex-col lg:pl-[260px]">
        <Header
          user={adminUser}
          isAdmin
          setSidebarOpen={setSidebarOpen}
          onPageChange={() => undefined}
        />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1520px]">
            <AdministrationModule className="bg-transparent" />
          </div>
        </main>

        <Footer version="2.1.0" />
      </div>
    </div>
  );
}
