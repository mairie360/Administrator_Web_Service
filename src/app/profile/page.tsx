"use client";

import { useState } from "react";
import {
  Footer,
  Header,
  Sidebar,
  UserProfile,
} from "@mairie360/lib-components";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import { adminUser } from "@/lib/current-user";
import { navigateToPage } from "@/lib/navigation";
import { sidebarItems } from "@/lib/sidebar-items";

const profileTitle = "Profil utilisateur";
const profileSubtitle = "Informations réelles du compte connecté";

export default function ProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const session = useAuthSession(adminUser);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
    setSidebarOpen(false);
  };

  const sidebar = (
    <Sidebar
      activeItem="profile"
      isAdmin={session.isAdmin}
      items={sidebarItems}
      brandLogoSrc={null}
      onItemSelect={(item) => handlePageChange(item.id)}
    />
  );

  return (
    <div className="h-screen overflow-hidden bg-[#f5f3f0] font-sans text-[#172033]">
      <div className="flex h-screen">
        <div className="hidden shrink-0 lg:block">{sidebar}</div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation mobile"
          >
            <button
              type="button"
              aria-label="Fermer la navigation"
              className="absolute inset-0 h-full w-full bg-black/35"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative h-full w-[260px] max-w-[82vw] shadow-2xl">
              {sidebar}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            user={session.user}
            isAdmin={session.isAdmin}
            setSidebarOpen={setSidebarOpen}
            profileHref="/profile"
            onPageChange={handlePageChange}
            onLogout={() => void logoutAndReload()}
          />

          <main className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {session.loading || session.error ? (
              <section aria-label={profileTitle} className="space-y-6 text-[#172033]">
                <header>
                  <h1 className="text-2xl font-bold leading-8">{profileTitle}</h1>
                  <p className="mt-1 text-sm leading-6 text-[#5f6770]">
                    {profileSubtitle}
                  </p>
                </header>

                <div className="overflow-hidden rounded-lg border border-[#e4e0dc] bg-white shadow-sm">
                  <div
                    role={session.error ? "alert" : "status"}
                    className={`flex min-h-40 items-center justify-center gap-3 px-6 py-10 text-sm font-medium ${
                      session.error
                        ? "bg-[#fff7f6] text-[#912018]"
                        : "text-[#5f6770]"
                    }`}
                  >
                    {session.error ? (
                      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                    ) : (
                      <LoaderCircle
                        className="h-5 w-5 shrink-0 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      {session.error || "Chargement des informations du profil…"}
                    </span>
                  </div>
                </div>
              </section>
            ) : (
              <UserProfile
                user={session.user}
                title={profileTitle}
                subtitle={profileSubtitle}
                editable={false}
              />
            )}
          </main>

          <Footer version="2.1.0" />
        </div>
      </div>
    </div>
  );
}
