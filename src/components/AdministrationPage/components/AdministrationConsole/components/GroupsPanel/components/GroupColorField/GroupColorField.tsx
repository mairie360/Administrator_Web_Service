"use client";
import { GROUP_COLORS, type GroupColor } from '@/lib/administration-api';
import { GROUP_COLOR_STYLES, groupColorToken } from '@/lib/group-colors';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName } from '@/components/AdministrationPage/controls';

/** MAIR-923: the colour of a group card, from the charter palette, with a swatch of the current choice. */
export const GroupColorField = ({ id, value, onChange }: { id: string; value: GroupColor | null; onChange: (color: GroupColor | null) => void }) => (
  <Field label="Couleur" htmlFor={id}>
    <span className="flex items-center gap-2">
      <span aria-hidden="true" data-testid={`${id}-swatch`} className="h-5 w-5 shrink-0 rounded-full border border-[var(--mairie-border)]" style={{ background: groupColorToken(value) }} />
      <select id={id} className={inputClassName} value={value ?? ""} onChange={(event) => onChange(event.target.value ? event.target.value as GroupColor : null)}>
        <option value="">Par défaut</option>
        {GROUP_COLORS.map((color) => <option key={color} value={color}>{GROUP_COLOR_STYLES[color].label}</option>)}
      </select>
    </span>
  </Field>
);
