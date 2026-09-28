import { parseFrontUrl } from "./front-url";

/** Reject a configured account destination that would loop back to /profile. */
export function settingsProfileUrl(value: string | undefined): string | undefined {
  const destination = parseFrontUrl(value);
  if (!destination) return undefined;

  try {
    const segments = decodeURIComponent(destination.pathname).split("/");
    if (segments.some((segment) => segment.toLowerCase() === "profile")) return undefined;
  } catch {
    return undefined;
  }

  return destination.href;
}
