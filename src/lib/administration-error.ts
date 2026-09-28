import { BffRequestError } from "./bff-client";

/** Keep service diagnostics out of the administrator-facing interface. */
export function administrationErrorMessage(error: unknown): string {
  if (error instanceof BffRequestError) {
    switch (error.status) {
      case 401:
        return "Authentification requise. Reconnectez-vous au portail Mairie360.";
      case 403:
        return "Votre compte ne possède pas les droits d’administration nécessaires.";
      case 400:
      case 422:
        return "La demande n’a pas pu être traitée. Vérifiez les informations saisies puis réessayez.";
      case 404:
        return "Ces informations ne sont plus disponibles. Actualisez la page puis réessayez.";
      case 409:
        return "Cette action entre en conflit avec une modification récente. Actualisez la page puis réessayez.";
      case 429:
        return "Trop de demandes ont été envoyées. Patientez un instant puis réessayez.";
      default:
        return "Le service d’administration est momentanément indisponible. Réessayez plus tard.";
    }
  }

  if (error instanceof TypeError) {
    return "Impossible de joindre le service d’administration. Vérifiez votre connexion puis réessayez.";
  }

  return "L’opération n’a pas pu aboutir. Réessayez ou contactez votre administrateur.";
}
