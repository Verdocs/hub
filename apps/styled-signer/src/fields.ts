export type TFieldKind = 'textbox' | 'signature' | 'initials' | 'date' | 'checkbox';

export interface SignerField {
  id: string;
  /** Label shown on the empty field box and beside it on the page. */
  label: string;
  kind: TFieldKind;
  /** Canned value shown once the field is completed. Signature, initials,
      and date fields compute their value at fill time instead. */
  filledValue: string;
}

/** The signing ceremony's fields, in the order the flag walks them. */
export const SIGNER_FIELDS: SignerField[] = [
  { id: 'full-name', label: 'Full name', kind: 'textbox', filledValue: 'Jordan Alvarez' },
  { id: 'title', label: 'Title', kind: 'textbox', filledValue: 'Operations Manager' },
  { id: 'agree', label: 'I agree', kind: 'checkbox', filledValue: 'checked' },
  { id: 'signature', label: 'Sign here', kind: 'signature', filledValue: '' },
  { id: 'initials', label: 'Initials', kind: 'initials', filledValue: '' },
  { id: 'date', label: 'Date signed', kind: 'date', filledValue: '' },
];
