export type TFieldKind = 'signature' | 'initials' | 'textbox' | 'checkbox' | 'date';

export interface StubField {
  id: string;
  /** Label shown inside the placed box (checkboxes render without one). */
  label: string;
  kind: TFieldKind;
  /** Which recipient the field belongs to; drives the tint color. */
  recipient: 1 | 2;
}

/** The fields placed on the fake document, in document order. */
export const BUILDER_FIELDS: StubField[] = [
  { id: 'agree', label: '', kind: 'checkbox', recipient: 1 },
  { id: 'signature-1', label: 'Signature', kind: 'signature', recipient: 1 },
  { id: 'full-name-1', label: 'Full name', kind: 'textbox', recipient: 1 },
  { id: 'date-1', label: 'Date signed', kind: 'date', recipient: 1 },
  { id: 'signature-2', label: 'Signature', kind: 'signature', recipient: 2 },
  { id: 'initials-2', label: 'Initials', kind: 'initials', recipient: 2 },
  { id: 'date-2', label: 'Date signed', kind: 'date', recipient: 2 },
];

const KIND_LABELS: Record<TFieldKind, string> = {
  signature: 'Signature field',
  initials: 'Initials field',
  textbox: 'Text field',
  checkbox: 'Checkbox field',
  date: 'Date field',
};

export function kindLabel(kind: TFieldKind): string {
  return KIND_LABELS[kind];
}
