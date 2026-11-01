// Text rules of the published BFF User admin contract (MAIR-514), carried by the inputs so the browser refuses a
// value before the BFF does: names ≤ 64 without `<` / `>`, e-mail ≤ 320, phone ≤ 32 made of digits, spaces, `.`,
// `-`, `(`, `)` and an optional leading `+`, password 8 to 255, role and group names ≤ 64, descriptions ≤ 2 000.

/** HTML `pattern` equivalent to the contract's `^[^<>]*$` (anchored by the browser, `v` flag). */
export const NO_MARKUP_PATTERN = "[^<>]*";
export const NO_MARKUP_HINT = "Les caractères < et > ne sont pas autorisés.";
/** HTML `pattern` equivalent to the contract's `^(?:\+?[\d\s.()-]+)?$`. */
export const PHONE_PATTERN = "(\\+?[\\d\\s.\\(\\)\\-]+)?";
export const PHONE_HINT = "Chiffres, espaces, points, tirets et parenthèses, avec un + initial facultatif (32 caractères maximum).";

export const NAME_MAX_LENGTH = 64;
export const EMAIL_MAX_LENGTH = 320;
export const PHONE_MAX_LENGTH = 32;
export const PASSWORD_MAX_LENGTH = 255;
export const DESCRIPTION_MAX_LENGTH = 2000;

/** Custom validity for a `<textarea>`, which has no `pattern` attribute. */
export function reportMarkupValidity(target: { value: string; setCustomValidity?: (message: string) => void }) {
  target.setCustomValidity?.(/[<>]/.test(target.value) ? NO_MARKUP_HINT : "");
}
