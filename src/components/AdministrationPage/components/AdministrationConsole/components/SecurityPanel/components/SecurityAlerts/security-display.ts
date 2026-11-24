import { describeUserAgent } from "@mairie360/lib-components/primitives";

/**
 * The beginning of an address, as the administration shows it (MAIR-773): `92.184.xxx.xxx` for IPv4, the first three
 * groups of an IPv6 address (`2001:db8:85a3:xxxx::`), « Inconnue » otherwise.
 */
export function maskIpAddress(ip: string | null | undefined): string {
  const value = (ip ?? "").trim();
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(value);
  if (ipv4) return `${ipv4[1]}.${ipv4[2]}.xxx.xxx`;
  if (value.includes(":")) {
    const groups = value.split("::")[0].split(":").filter(Boolean).slice(0, 3);
    if (groups.length > 0 && groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group))) return `${groups.join(":")}:xxxx::`;
  }
  return "Inconnue";
}

/** « Chrome 131 sur Windows », « Appareil inconnu » without user agent. */
export function deviceOf(deviceInfo: string | null): string {
  if (!deviceInfo) return "Appareil inconnu";
  const { browser, os } = describeUserAgent(deviceInfo);
  return `${browser} sur ${os}`;
}
