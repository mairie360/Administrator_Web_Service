"use client";

import { UserProfilePage } from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import { adminUser } from "@/lib/current-user";
import { navigateToPage } from "@/lib/navigation";
import { sidebarItems } from "@/lib/sidebar-items";

export default function ProfilePage() {
  const router = useRouter();

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
  };

  return (
    <UserProfilePage
      user={adminUser}
      isAdmin
      headerProps={{
        profileHref: "/profile",
        onPageChange: handlePageChange,
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
