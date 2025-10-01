import {isValidInput} from '../Templates';
import {IEnvelopeField} from '../Models';

export const isFieldFilled = (field: IEnvelopeField, allRecipientFields: IEnvelopeField[]) => {
  const {value = ''} = field;
  switch (field.type as any) {
    case 'textarea':
    case 'textbox':
      switch (field.validator || '') {
        case 'email':
          return value && isValidInput(value, 'email');
        case 'phone':
          return value && isValidInput(value, 'phone');
        default:
          return (value || '').trim() !== '';
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
      if (!!field.group) {
        return allRecipientFields.filter((f) => f.group === field.group).some((field) => field.value === 'true');
      }

      return field.value === 'true';

    default:
      return false;
  }
};

// TODO: Only allow !required to bypass validation if the field is empty.
export const isFieldValid = (field: IEnvelopeField, allRecipientFields: IEnvelopeField[]) => {
  return !field.required || isFieldFilled(field, allRecipientFields);
};
