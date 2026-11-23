"use client";
import { Lock } from "lucide-react";
import { Button, DataState } from "@mairie360/lib-components/primitives";

import { getActiveFrontHrefs } from '@/lib/navigation';

/** F14 (MAIR-910): a signed-in non-administrator sees no administration data, only the way back. */
export const AccessDenied = () => {
  const dashboard = getActiveFrontHrefs().dashboard;
  return (
    <DataState state="unavailable" title="Accès réservé aux administrateurs"
      description="Votre profil ne permet pas d’ouvrir la console d’administration. Demandez l’accès à un administrateur de votre mairie."
      action={dashboard ? <Button variant="outline" tone="neutral" icon={Lock} onClick={() => window.location.assign(dashboard)}>Retour au tableau de bord</Button> : undefined} />
  );
};
