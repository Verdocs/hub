import {getValidators, isValidInput} from '../Templates';
import {IEnvelopeField} from '../Models';

// Validators API callers set that we don't know are treated as plain text, so they never block a signer.
const hasFormat = (field: IEnvelopeField) => !!field.validator && getValidators().includes(field.validator);

/**
 * @sdkOperation envelope.isFieldFilled
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const isFieldFilled = (field: IEnvelopeField, allRecipientFields: IEnvelopeField[]) => {
  const {value = ''} = field;
  switch (field.type as any) {
    case 'textarea':
    case 'textbox':
      return hasFormat(field) ? isValidInput((value || '').trim(), field.validator!) : (value || '').trim() !== '';

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
 * left empty, but a text field that has a value still has to match its format.
 *
 * @sdkOperation envelope.isFieldValid
 * @sdkGroup Envelope
 * @sdkPage Helpers
 */
export const isFieldValid = (field: IEnvelopeField, allRecipientFields: IEnvelopeField[]) => {
  if (field.required) {
    return isFieldFilled(field, allRecipientFields);
  }

  const value = (field.value || '').trim();
  return !value || !['textbox', 'textarea'].includes(field.type) || !hasFormat(field) || isValidInput(value, field.validator!);
};
