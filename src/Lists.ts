import type {TFieldType} from './BaseTypes';

export const FIELD_TYPES: TFieldType[] = [
  'textbox',
  'signature',
  'initial',
  'date',
  'dropdown',
  'timestamp',
  /** @deprecated. Use `textbox` with multiLine set to > 1 */
  'textarea',
  'checkbox',
  'radio',
  'attachment',
  'payment',
];

export const DEFAULT_FIELD_WIDTHS: Record<TFieldType, number> = {
  signature: 71,
  initial: 71,
  date: 75,
  timestamp: 130,
  textbox: 150,
  textarea: 150,
  checkbox: 14,
  radio: 14,
  dropdown: 85,
  attachment: 24,
  payment: 24,
};

export const DEFAULT_FIELD_HEIGHTS: Record<TFieldType, number> = {
  signature: 36,
  initial: 36,
  date: 15,
  timestamp: 15,
  textbox: 15,
  textarea: 41,
  checkbox: 14,
  radio: 14,
  dropdown: 20,
  attachment: 24,
  payment: 24,
};
