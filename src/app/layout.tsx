import { parseAppearanceCookie, APPEARANCE_COOKIE } from '@mairie360/front-kit/theme';
import { cookies } from 'next/headers';
import { jwtDisplayRole, instanceTimeZone } from '@mairie360/front-kit/shared';
import { InstanceProvider } from '@mairie360/front-kit/react';
import type { Metadata } from "next";
import { readFrontUrlsFromEnv } from "@/lib/front-urls";
import { FrontUrlsProvider } from "@/lib/front-urls-provider";
import { Geist, Geist_Mono } from "next/font/google";
import "@mairie360/lib-components/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rendu à la demande obligatoire : une page prérendue au build ne porterait pas le
// nonce CSP propre à chaque requête, et ses scripts seraient bloqués.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration | Mairie360",
  description: "Interface d'administration Mairie360",
  icons: {
    icon: [
      { url: "/favicon.ico?v=8dd52d5111b8", sizes: "192x192", type: "image/x-icon" },
      { url: "/mairie360-favicon.png?v=8dd52d5111b8", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/mairie360-logo.png?v=8dd52d5111b8", sizes: "192x192", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const role = jwtDisplayRole(cookieStore.get('accessToken')?.value);
  const appearance = parseAppearanceCookie(cookieStore.get(APPEARANCE_COOKIE)?.value);
  const timeZone = instanceTimeZone(process.env.INSTANCE_TIMEZONE);
  return (
    <html lang="fr" data-theme={appearance?.theme ?? "system"} data-density={appearance?.density ?? "normal"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} mairie-ui antialiased`}
      >
        <InstanceProvider role={role} timeZone={timeZone} appearance={appearance} appearanceCookieDomain={process.env.COOKIE_DOMAIN}><FrontUrlsProvider urls={readFrontUrlsFromEnv()} cookieDomain={process.env.COOKIE_DOMAIN}>{children}</FrontUrlsProvider></InstanceProvider>
      </body>
    </html>
  );
}
