import {getValidators, isValidInput} from '../Templates';
import {IEnvelopeField, IFieldNumberFormat} from '../Models';

// Validators API callers set that we don't know are treated as plain text, so they never block a signer.
const hasFormat = (field: IEnvelopeField) => !!field.validator && getValidators().includes(field.validator);

const matchesPattern = (pattern: string, value: string) => {
  try {
    return new RegExp(`^(?:${pattern})$`).test(value);
  } catch {
    // Never block a signer on a broken pattern
    return true;
  }
};

const matchesMask = (mask: string, value: string) =>
  value.length === mask.length && [...mask].every((char, index) => char === '_' || char === value[index]);

// How number fields store their values: a dot for decimals, no grouping or symbols
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

const textConfigOf = (field: IEnvelopeField) => (field.config?.type === 'textbox' || field.config?.type === 'textarea' ? field.config : undefined);

/**
 * Read a number the way a number format's locale writes it, like "12.450,50" for de-DE or "$12,450.50" for en-US.
 * Pass a text field's config.number. Returns null when the text isn't a number. Save the result as a plain string
 * (String(number)), since that's how number fields store their values.
 *
 * ```typescript
 * import {parseFieldNumber} from '@verdocs/js-sdk';
 *
 * parseFieldNumber({style: 'number', locale: 'de-DE'}, '12.450,50'); // 12450.5
 * ```
 *
 * @sdkOperation envelope.parseFieldNumber
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const parseFieldNumber = (format: IFieldNumberFormat | null | undefined, text: string | null | undefined): number | null => {
  const value = (text ?? '').trim();
  try {
    const decimal = new Intl.NumberFormat(format?.locale || 'en-US').formatToParts(1.5).find((part) => part.type === 'decimal')?.value || '.';
    const [whole = '', fraction, ...extra] = value.split(decimal).map((part) => part.replace(/\D/g, ''));
    if (extra.length || (!whole && !fraction)) {
      return null;
    }

    const number = Number(`${whole || '0'}${fraction ? `.${fraction}` : ''}`);
    return /^\(.*\)$|[-\u2212]/.test(value) ? -number : number;
  } catch {
    return null;
  }
};

/**
 * Show a number field's stored value the way its format writes it, like "$12,450.50" for 12450.5 as en-US currency.
 * Pass a text field's config.number. Values that aren't plain numbers come back unchanged.
 *
 * ```typescript
 * import {formatFieldNumber} from '@verdocs/js-sdk';
 *
 * formatFieldNumber({style: 'number', locale: 'de-DE', decimals: 2}, '12450.5'); // '12.450,50'
 * ```
 *
 * @sdkOperation envelope.formatFieldNumber
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const formatFieldNumber = (format: IFieldNumberFormat | null | undefined, value: string | null | undefined): string => {
  const text = (value ?? '').trim();
  if (!format?.style || !PLAIN_NUMBER.test(text)) {
    return value ?? '';
  }

  try {
    return new Intl.NumberFormat(format.locale || 'en-US', {
      style: format.style === 'number' ? 'decimal' : format.style,
      currency: format.currency || 'USD',
      minimumFractionDigits: format.decimals ?? undefined,
      maximumFractionDigits: format.decimals ?? (format.style === 'percent' ? 2 : undefined),
    }).format(format.style === 'percent' ? Number(text) / 100 : Number(text));
  } catch {
    return value ?? '';
  }
};

/** Which of a text field's checks a value fails. */
export type TFieldFormatProblem = 'format' | 'range' | 'mask' | 'pattern' | 'length';

/**
 * Check a text field's value against its format (validator, or number style and range), mask, pattern, and character
 * limit, returning the first check it fails or null. Empty values pass, since isFieldFilled decides whether a field
 * has to be filled in. Number fields accept their stored plain number or the text their locale writes.
 *
 * ```typescript
 * import {getFieldFormatProblem} from '@verdocs/js-sdk';
 *
 * getFieldFormatProblem({...field, validator: 'email'}, 'jordan@example'); // 'format'
 * getFieldFormatProblem({...field, config: {type: 'textbox', input_mask: '(___) ___-____'}}, '(555) 012-3456'); // null
 * ```
 *
 * @sdkOperation envelope.getFieldFormatProblem
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const getFieldFormatProblem = (field: IEnvelopeField, value: string): TFieldFormatProblem | null => {
  if (!value) {
    return null;
  }

  const config = textConfigOf(field);
  if (config?.number) {
    const number = PLAIN_NUMBER.test(value) ? Number(value) : parseFieldNumber(config.number, value);
    if (number === null) {
      return 'format';
    }

    if ((config.number.min != null && number < config.number.min) || (config.number.max != null && number > config.number.max)) {
      return 'range';
    }
  } else if (hasFormat(field) && !isValidInput(value, field.validator!)) {
    return 'format';
  }

  if (config?.input_mask && !matchesMask(config.input_mask, value)) {
    return 'mask';
  }

  if (config?.validation?.pattern && !matchesPattern(config.validation.pattern, value)) {
    return 'pattern';
  }

  return config?.max_length && value.length > config.max_length ? 'length' : null;
};

// Date fields hold MM/dd/yyyy. Today counts as both past and future.
const dateOutsideRange = (field: IEnvelopeField) => {
  const config = field.config?.type === 'date' ? field.config : undefined;
  const [, month, day, year] = (field.value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/) || [];
  if (!config || !year) {
    return false;
  }

  const chosen = `${year}-${month}-${day}`;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return (
    (config.allowed === 'past' && chosen > today) ||
    (config.allowed === 'future' && chosen < today) ||
    (!!config.min && chosen < config.min) ||
    (!!config.max && chosen > config.max)
  );
};

/**
 * @sdkOperation envelope.isFieldFilled
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const isFieldFilled = (field: IEnvelopeField, allRecipientFields: IEnvelopeField[]) => {
  const {value = ''} = field;
  switch (field.type as any) {
    case 'textarea':
    case 'textbox': {
      const text = (value || '').trim();
      return text !== '' && !getFieldFormatProblem(field, text);
    }

    case 'signature':
      return value === 'signed';

    case 'initial':
      return value === 'initialed';

    // Timestamp fields get automatically filled when the envelope is submitted.
    case 'timestamp':
      return true;

    case 'date':
      return !!value && !dateOutsideRange(field);

    case 'attachment':
      return value === 'attached';

    case 'dropdown':
      return value !== '';

    case 'checkbox':
      return value === 'true';

    case 'radio':
      if (field.group) {
        return allRecipientFields.filter((f) => f.group === field.group).some((field) => field.value === 'true');
      }

      return field.value === 'true';

    default:
      return false;
  }
};

/**
 * Check whether a field is ready to submit. A required field has to be filled in. An optional field can be
 * left empty, but a text field that has a value still has to pass getFieldFormatProblem, and a date has to fall
 * within its config's allowed range. Read-only fields are always ready, since the signer can't change them.
 *
 * @sdkOperation envelope.isFieldValid
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const isFieldValid = (field: IEnvelopeField, allRecipientFields: IEnvelopeField[]) => {
  if (field.readonly) {
    return true;
  }

  if (field.required) {
    return isFieldFilled(field, allRecipientFields);
  }

  if (field.type === 'date') {
    return !dateOutsideRange(field);
  }

  return !['textbox', 'textarea'].includes(field.type) || !getFieldFormatProblem(field, (field.value || '').trim());
};
