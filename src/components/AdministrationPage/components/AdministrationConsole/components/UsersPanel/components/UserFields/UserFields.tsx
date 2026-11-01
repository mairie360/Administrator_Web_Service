"use client";
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, NO_MARKUP_HINT, NO_MARKUP_PATTERN, PHONE_HINT, PHONE_MAX_LENGTH, PHONE_PATTERN } from '@/lib/text-constraints';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName } from '@/components/AdministrationPage/controls';

export interface UserIdentityDraft { first_name: string; last_name: string; email: string; phone_number: string }

/** First name, last name, e-mail and phone with the contract constraints; `prefix` keeps the historical ids (`create-*`, `edit-*`). */
export const UserFields = <T extends UserIdentityDraft>({ prefix, form, onChange }: { prefix: "create" | "edit"; form: T; onChange: (field: keyof UserIdentityDraft, value: string) => void }) => (
  <>
    <Field label="Prénom" htmlFor={`${prefix}-first-name`}>
      <input id={`${prefix}-first-name`} required maxLength={NAME_MAX_LENGTH} pattern={NO_MARKUP_PATTERN} title={NO_MARKUP_HINT} className={inputClassName} value={form.first_name} onChange={(event) => onChange("first_name", event.target.value)} />
    </Field>
    <Field label="Nom" htmlFor={`${prefix}-last-name`}>
      <input id={`${prefix}-last-name`} required maxLength={NAME_MAX_LENGTH} pattern={NO_MARKUP_PATTERN} title={NO_MARKUP_HINT} className={inputClassName} value={form.last_name} onChange={(event) => onChange("last_name", event.target.value)} />
    </Field>
    <Field label="Adresse e-mail" htmlFor={`${prefix}-email`}>
      <input id={`${prefix}-email`} type="email" required maxLength={EMAIL_MAX_LENGTH} className={inputClassName} value={form.email} onChange={(event) => onChange("email", event.target.value)} />
    </Field>
    <Field label="Téléphone" htmlFor={`${prefix}-phone`}>
      <input id={`${prefix}-phone`} type="tel" maxLength={PHONE_MAX_LENGTH} pattern={PHONE_PATTERN} title={PHONE_HINT} className={inputClassName} value={form.phone_number} onChange={(event) => onChange("phone_number", event.target.value)} />
    </Field>
  </>
);
