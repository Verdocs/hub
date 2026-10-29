import {formatFieldNumber, getFieldFormatProblem, isFieldFilled, isFieldValid, isValidInput, parseFieldNumber} from '../../index';
import {IEnvelopeField, ITextFieldConfig} from '../../Models';

const field = (over: Partial<IEnvelopeField>) => ({name: 'f', type: 'textbox', required: true, value: '', validator: null, ...over}) as IEnvelopeField;
const text = (config: Omit<ITextFieldConfig, 'type'>, over: Partial<IEnvelopeField> = {}) => field({config: {type: 'textbox', ...config}, ...over});

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
    const phone = text({input_mask: '(___) ___-____'});
    expect(getFieldFormatProblem(phone, '(555) 012-3456')).toBeNull();
    expect(getFieldFormatProblem(phone, '(555) 012-345')).toBe('mask');
    expect(getFieldFormatProblem(phone, '555-012-34567')).toBe('mask');
  });

  it('matches the whole value against a pattern', () => {
    const policy = text({validation: {pattern: 'HO-\\d{4}'}});
    expect(getFieldFormatProblem(policy, 'HO-1234')).toBeNull();
    expect(getFieldFormatProblem(policy, 'HO-12345')).toBe('pattern');
    expect(getFieldFormatProblem(policy, 'xHO-1234')).toBe('pattern');
    expect(getFieldFormatProblem(text({validation: {pattern: '(broken'}}), 'anything')).toBeNull();
  });

  it('checks the character limit last', () => {
    expect(getFieldFormatProblem(text({max_length: 5}), '12345')).toBeNull();
    expect(getFieldFormatProblem(text({max_length: 5}), '123456')).toBe('length');
    expect(getFieldFormatProblem(text({max_length: 5}, {validator: 'email'}), 'too long to be an email')).toBe('format');
  });

  it('holds optional fields to masks and patterns once filled', () => {
    expect(isFieldValid(text({input_mask: '___-__-____'}, {required: false, value: ''}), [])).toBe(true);
    expect(isFieldValid(text({input_mask: '___-__-____'}, {required: false, value: '123-45'}), [])).toBe(false);
    expect(isFieldFilled(text({validation: {pattern: '[A-Z]{2}'}}, {value: 'OH'}), [])).toBe(true);
    expect(isFieldFilled(text({validation: {pattern: '[A-Z]{2}'}}, {value: 'Ohio'}), [])).toBe(false);
  });

  it('formats a stored number the way the field locale writes it', () => {
    const euros = {style: 'currency', locale: 'de-DE', currency: 'EUR'} as const;
    expect(formatFieldNumber(euros, '12450.5')).toBe('12.450,50\u00a0\u20ac');
    expect(formatFieldNumber({style: 'currency'}, '12450.5')).toBe('$12,450.50');
    expect(formatFieldNumber({style: 'percent'}, '12.5')).toBe('12.5%');
    expect(formatFieldNumber({style: 'number', decimals: 0}, '12450.5')).toBe('12,451');
    expect(formatFieldNumber(euros, 'not a number')).toBe('not a number');
    expect(formatFieldNumber(null, '12450.5')).toBe('12450.5');
  });

  it('reads a number the way the field locale writes it', () => {
    expect(parseFieldNumber({style: 'currency', locale: 'de-DE'}, '12.450,50 \u20ac')).toBe(12450.5);
    expect(parseFieldNumber({style: 'currency'}, '-$12,450.50')).toBe(-12450.5);
    expect(parseFieldNumber({style: 'currency'}, '($1,000)')).toBe(-1000);
    expect(parseFieldNumber({style: 'percent'}, '12.5%')).toBe(12.5);
    expect(parseFieldNumber({style: 'number'}, '1.2.3')).toBeNull();
    expect(parseFieldNumber({style: 'number'}, 'none')).toBeNull();
  });

  it('checks a number field by its style and range, not the number validator', () => {
    const premium = text({number: {style: 'currency', min: 0, max: 1000}}, {validator: 'number'});
    expect(getFieldFormatProblem(premium, '$999.99')).toBeNull();
    expect(getFieldFormatProblem(premium, '999.99')).toBeNull();
    expect(getFieldFormatProblem(premium, '$1,000.01')).toBe('range');
    expect(getFieldFormatProblem(premium, 'lots')).toBe('format');
    expect(isFieldValid({...premium, value: '1500'}, [])).toBe(false);
  });

  it('holds a date to its allowed range', () => {
    const date = (config: Record<string, unknown>, value: string) => field({type: 'date', required: false, value, config: {type: 'date', ...config}});
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
    expect(isFieldValid(date({allowed: 'future'}, today), [])).toBe(true);
    expect(isFieldValid(date({allowed: 'future'}, '01/01/2000'), [])).toBe(false);
    expect(isFieldValid(date({allowed: 'past'}, '01/01/2000'), [])).toBe(true);
    expect(isFieldValid(date({allowed: 'past'}, '01/01/2999'), [])).toBe(false);
    expect(isFieldValid(date({min: '2026-01-01', max: '2026-12-31'}, '06/15/2026'), [])).toBe(true);
    expect(isFieldValid(date({min: '2026-01-01', max: '2026-12-31'}, '01/15/2027'), [])).toBe(false);
    expect(isFieldFilled({...date({allowed: 'past'}, '01/01/2999'), required: true}, [])).toBe(false);
    expect(isFieldValid(date({allowed: 'future'}, ''), [])).toBe(true);
  });

  it('never holds a signer to a read-only value', () => {
    expect(isFieldValid(field({required: false, readonly: true, validator: 'email', value: 'n/a'}), [])).toBe(true);
  });

  it('leaves optional non-text fields alone', () => {
    expect(isFieldValid(field({type: 'checkbox', required: false, value: 'false'}), [])).toBe(true);
  });
});
