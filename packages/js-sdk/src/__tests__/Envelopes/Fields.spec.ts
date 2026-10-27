import {isFieldFilled, isFieldValid, isValidInput} from '../../index';
import {IEnvelopeField} from '../../Models';

const field = (over: Partial<IEnvelopeField>) => ({name: 'f', type: 'textbox', required: true, value: '', validator: null, ...over}) as IEnvelopeField;

describe('Field formats', () => {
  it('enforces every known format on a required text field', () => {
    expect(isFieldValid(field({validator: 'email', value: 'jordan@example.com'}), [])).toBe(true);
    expect(isFieldValid(field({validator: 'email', value: 'jordan@example'}), [])).toBe(false);
    expect(isFieldValid(field({validator: 'url', value: 'https://verdocs.com'}), [])).toBe(true);
    expect(isFieldValid(field({validator: 'url', value: 'verdocs'}), [])).toBe(false);
    expect(isFieldValid(field({validator: 'postal_code', value: '43215'}), [])).toBe(true);
    expect(isFieldValid(field({validator: 'number', value: 'twelve'}), [])).toBe(false);
    expect(isFieldValid(field({validator: 'ssn', value: '123-45-6789'}), [])).toBe(true);
    expect(isFieldValid(field({validator: 'ssn', value: '12-345-6789'}), [])).toBe(false);
  });

  it('accepts numbers with separators, decimals, and a sign', () => {
    ['12450', '12,450', '-12.5', '1,234,567.89'].forEach((value) => expect(isValidInput(value, 'number')).toBe(true));
    ['12,45', '1.2.3', '$12'].forEach((value) => expect(isValidInput(value, 'number')).toBe(false));
  });

  it('anchors dates at both ends', () => {
    expect(isValidInput('2026-10-27', 'date')).toBe(true);
    expect(isValidInput('10/27/2026', 'date')).toBe(true);
    expect(isValidInput('2026-10-27 or so', 'date')).toBe(false);
  });

  it('lets optional fields stay empty but checks them once filled', () => {
    expect(isFieldValid(field({required: false, validator: 'email', value: ''}), [])).toBe(true);
    expect(isFieldValid(field({required: false, validator: 'email', value: '  '}), [])).toBe(true);
    expect(isFieldValid(field({required: false, validator: 'email', value: 'not an email'}), [])).toBe(false);
    expect(isFieldValid(field({required: false, validator: 'email', value: 'jordan@example.com'}), [])).toBe(true);
  });

  it('ignores surrounding spaces', () => {
    expect(isFieldFilled(field({validator: 'email', value: ' jordan@example.com '}), [])).toBe(true);
  });

  it('treats validators it does not know as plain text', () => {
    expect(isFieldValid(field({validator: 'custom_thing', value: 'anything'}), [])).toBe(true);
    expect(isFieldValid(field({validator: 'custom_thing', value: ''}), [])).toBe(false);
    expect(isFieldValid(field({required: false, validator: 'custom_thing', value: 'anything'}), [])).toBe(true);
  });

  it('leaves optional non-text fields alone', () => {
    expect(isFieldValid(field({type: 'checkbox', required: false, value: 'false'}), [])).toBe(true);
  });
});
