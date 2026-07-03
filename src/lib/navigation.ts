const pageRoutes: Record<string, string> = {
  admin: "/",
  dashboard: "/",
  profile: "/profile",
};

export function getPageHref(page: string) {
  return pageRoutes[page] ?? null;
}
