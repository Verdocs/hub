import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldTimestamp from './VerdocsFieldTimestamp.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-timestamp-1',
  role_name: 'Recipient 1',
  type: 'timestamp',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 100,
  y: 320,
  width: 160,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const STAMPED_AT = '2026-06-01T15:30:00.000Z';

describe('VerdocsFieldTimestamp', () => {
  it('hints that empty fields fill at signing time', () => {
    const wrapper = mount(VerdocsFieldTimestamp, { props: { field: sampleField() } });

    expect(wrapper.text()).toBe('Filled at signing');
  });

  it('prefers the field placeholder for the hint', () => {
    const wrapper = mount(VerdocsFieldTimestamp, { props: { field: sampleField({ placeholder: 'Stamped on submit' }) } });

    expect(wrapper.text()).toBe('Stamped on submit');
  });

  it('displays a set value as a localized timestamp with the signer class', () => {
    const wrapper = mount(VerdocsFieldTimestamp, { props: { field: sampleField({ value: STAMPED_AT }), signerIndex: 1 } });

    expect(wrapper.text()).toBe(new Date(STAMPED_AT).toLocaleString());
    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });

  it('offers no input, and marks required fields on the wrapper', () => {
    const wrapper = mount(VerdocsFieldTimestamp, { props: { field: sampleField({ required: true }) } });

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-field-required');
  });

  it('renders the done treatment with the final value', () => {
    const wrapper = mount(VerdocsFieldTimestamp, { props: { field: sampleField({ value: STAMPED_AT }), done: true } });

    expect(wrapper.text()).toBe(new Date(STAMPED_AT).toLocaleString());
    expect(wrapper.classes()).toContain('vdocs-field-done');
  });
});
