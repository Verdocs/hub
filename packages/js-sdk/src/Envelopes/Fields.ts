import {getValidators, isValidInput} from '../Templates';
import {IEnvelopeField} from '../Models';

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

/** Which of a text field's checks a value fails. */
export type TFieldFormatProblem = 'format' | 'mask' | 'pattern' | 'length';

/**
 * Check a text field's value against its format (validator), mask, pattern, and character limit, returning the
 * first check it fails or null. Empty values pass, since isFieldFilled decides whether a field has to be filled in.
 *
 * ```typescript
 * import {getFieldFormatProblem} from '@verdocs/js-sdk';
 *
 * getFieldFormatProblem({...field, validator: 'email'}, 'jordan@example'); // 'format'
 * getFieldFormatProblem({...field, input_mask: '(___) ___-____'}, '(555) 012-3456'); // null
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

  if (hasFormat(field) && !isValidInput(value, field.validator!)) {
    return 'format';
  }

  if (field.input_mask && !matchesMask(field.input_mask, value)) {
    return 'mask';
  }

  if (field.validation_pattern && !matchesPattern(field.validation_pattern, value)) {
    return 'pattern';
  }

  return field.max_length && value.length > field.max_length ? 'length' : null;
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
      return !!value;

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
 * left empty, but a text field that has a value still has to pass getFieldFormatProblem. Read-only fields are
 * always ready, since the signer can't change them.
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

  return !['textbox', 'textarea'].includes(field.type) || !getFieldFormatProblem(field, (field.value || '').trim());
};
