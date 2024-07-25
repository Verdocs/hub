import {ITemplateFieldSetting} from './Models';
import type {TFieldType} from './BaseTypes';

export const FIELD_TYPES: TFieldType[] = [
  'textbox',
  'signature',
  'initial',
  'date',
  'dropdown',
  'timestamp',
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
  checkbox_group: 14,
  radio_button_group: 14,
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
  checkbox_group: 14,
  radio_button_group: 14,
  radio: 14,
  dropdown: 20,
  attachment: 24,
  payment: 24,
};

export const DEFAULT_FIELD_SETTINGS: Record<TFieldType, ITemplateFieldSetting> = {
  signature: {result: ''},
  initial: {result: ''},
  date: {width: 75, height: 15, result: ''},
  timestamp: {width: 130, height: 15},
  textbox: {width: 150, height: 15, result: '', leading: 0, alignment: 0, upperCase: false},
  textarea: {width: 150, height: 15, result: '', leading: 16, alignment: 0, upperCase: false},
  checkbox: {},
  checkbox_group: {
    minimum_checked: 0,
    maximum_checked: 1000,
    options: [
      // { id: `${field.name}-1`, value: 'Option 1', checked: false, x, y },
    ],
  },
  radio_button_group: {
    options: [
      // { id: `${field.name}-1`, value: 'Option 1', selected: false, x, y }
    ],
  },
  radio: {},
  dropdown: {
    width: 85,
    height: 20,
    value: null,
    placeholder: 'Choose',
    options: [{id: 'option-1', value: 'Option 1'}],
  },
  attachment: {},
  payment: {},
};
