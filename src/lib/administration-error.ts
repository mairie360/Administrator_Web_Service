import { InvalidAdministrationResponseError } from "./administration-response";
import { BffRequestError } from "./bff-client";
import type { BffErrorDetail } from "./bff-client";

const FIELD_LABELS: Readonly<Record<string, string>> = {
  first_name: "Prénom",
  last_name: "Nom",
  email: "Adresse e-mail",
  phone_number: "Téléphone",
  phone_country: "Pays du téléphone",
  password: "Mot de passe",
  new_password: "Nouveau mot de passe",
  name: "Nom",
  description: "Description",
  role_ids: "Rôles",
  user_ids: "Membres",
};

function translateDetail(message: string): string {
  if (/Must not contain < or >/.test(message)) return "ne doit pas contenir les caractères < ou >";
  if (/^Expected a phone number/.test(message)) return "chiffres, espaces, points, tirets, parenthèses et un + initial seulement";
  if (/^Invalid email/.test(message)) return "adresse e-mail invalide";
  const max = message.match(/at most (\d+) character|<=(\d+) characters/);
  if (max) return `${max[1] ?? max[2]} caractères maximum`;
  const min = message.match(/at least (\d+) character|>=(\d+) characters/);
  if (min) return (min[1] ?? min[2]) === "1" ? "ne doit pas être vide" : `${min[1] ?? min[2]} caractères minimum`;
  if (/^Required$/.test(message)) return "requis";
  return message;
}

/** `body.first_name` → `Prénom : ne doit pas contenir les caractères < ou >` (MAIR-514). */
export function describeValidationDetail({ path, message }: BffErrorDetail): string {
  const field = path?.split(".").filter((part) => part && part !== "body" && !/^\d+$/.test(part))[0];
  const text = translateDetail(message);
  return field ? `${FIELD_LABELS[field] ?? field} : ${text}` : text;
}

/** Keep service diagnostics out of the administrator-facing interface. */
export function administrationErrorMessage(error: unknown): string {
  if (error instanceof InvalidAdministrationResponseError) return error.message;
  if (error instanceof BffRequestError) {
    switch (error.status) {
      case 401:
        return "Authentification requise. Reconnectez-vous au portail Mairie360.";
      case 403:
        return "Votre compte ne possède pas les droits d’administration nécessaires.";
      case 400:
      case 422:
        if (error.details.length > 0) {
          const lines = [...new Set(error.details.map(describeValidationDetail))];
          return `La demande n’a pas pu être traitée. Vérifiez les champs signalés : ${lines.join(" ; ")}.`;
        }
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
