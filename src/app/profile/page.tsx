"use client";

import { UserProfilePage } from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import { adminUser } from "@/lib/current-user";
import { navigateToPage } from "@/lib/navigation";
import { sidebarItems } from "@/lib/sidebar-items";

export default function ProfilePage() {
  const router = useRouter();
  const session = useAuthSession(adminUser);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
  };

  return (
    <UserProfilePage
      user={session.user}
      isAdmin={session.isAdmin}
      headerProps={{
        profileHref: "/profile",
        onPageChange: handlePageChange,
        onLogout: () => void logoutAndReload(),
      }}
      sidebarProps={{
        items: sidebarItems,
        brandLogoSrc: null,
      }}
      footerProps={{
        version: "2.1.0",
      }}
    />
  );
}
