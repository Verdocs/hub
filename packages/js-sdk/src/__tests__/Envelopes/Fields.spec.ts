import {getFieldFormatProblem, isFieldFilled, isFieldValid, isValidInput} from '../../index';
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

  it('fills a mask in every space, keeping its other characters', () => {
    const phone = field({input_mask: '(___) ___-____'});
    expect(getFieldFormatProblem(phone, '(555) 012-3456')).toBeNull();
    expect(getFieldFormatProblem(phone, '(555) 012-345')).toBe('mask');
    expect(getFieldFormatProblem(phone, '555-012-34567')).toBe('mask');
  });

  it('matches the whole value against a pattern', () => {
    const policy = field({validation_pattern: 'HO-\\d{4}'});
    expect(getFieldFormatProblem(policy, 'HO-1234')).toBeNull();
    expect(getFieldFormatProblem(policy, 'HO-12345')).toBe('pattern');
    expect(getFieldFormatProblem(policy, 'xHO-1234')).toBe('pattern');
    expect(getFieldFormatProblem(field({validation_pattern: '(broken'}), 'anything')).toBeNull();
  });

  it('checks the character limit last', () => {
    expect(getFieldFormatProblem(field({max_length: 5}), '12345')).toBeNull();
    expect(getFieldFormatProblem(field({max_length: 5}), '123456')).toBe('length');
    expect(getFieldFormatProblem(field({validator: 'email', max_length: 5}), 'too long to be an email')).toBe('format');
  });

  it('holds optional fields to masks and patterns once filled', () => {
    expect(isFieldValid(field({required: false, input_mask: '___-__-____', value: ''}), [])).toBe(true);
    expect(isFieldValid(field({required: false, input_mask: '___-__-____', value: '123-45'}), [])).toBe(false);
    expect(isFieldFilled(field({validation_pattern: '[A-Z]{2}', value: 'OH'}), [])).toBe(true);
    expect(isFieldFilled(field({validation_pattern: '[A-Z]{2}', value: 'Ohio'}), [])).toBe(false);
  });

  it('never holds a signer to a read-only value', () => {
    expect(isFieldValid(field({required: false, readonly: true, validator: 'email', value: 'n/a'}), [])).toBe(true);
  });

  it('leaves optional non-text fields alone', () => {
    expect(isFieldValid(field({type: 'checkbox', required: false, value: 'false'}), [])).toBe(true);
  });
});
