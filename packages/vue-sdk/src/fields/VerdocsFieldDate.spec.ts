import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldDate from './VerdocsFieldDate.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-date-1',
  role_name: 'Recipient 1',
  type: 'date',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Lease Start',
  prepared: false,
  page: 1,
  x: 100,
  y: 280,
  width: 74,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldDate', () => {
  it('seeds a native date input from the field value', () => {
    const wrapper = mount(VerdocsFieldDate, { props: { field: sampleField({ value: '2026-08-01' }) } });

    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('date');
    expect(input.attributes('aria-label')).toBe('Lease Start');
    expect(input.element.value).toBe('2026-08-01');
  });

  it('trims full ISO timestamps to the date the input understands', () => {
    const wrapper = mount(VerdocsFieldDate, { props: { field: sampleField({ value: '2026-08-01T15:30:00.000Z' }) } });

    expect(wrapper.get('input').element.value).toBe('2026-08-01');
  });

  it('emits picked dates as ISO yyyy-mm-dd strings', async () => {
    const wrapper = mount(VerdocsFieldDate, { props: { field: sampleField() } });

    await wrapper.get('input').setValue('2026-08-15');

    expect(wrapper.emitted('fieldChange')).toEqual([ [ '2026-08-15' ] ]);
  });

  it('disables input when disabled or the field is readonly, and marks required fields', () => {
    const wrapper = mount(VerdocsFieldDate, { props: { field: sampleField({ required: true }), disabled: true } });
    expect(wrapper.get('input').element.disabled).toBe(true);
    expect(wrapper.get('input').element.required).toBe(true);
    expect(wrapper.classes()).toContain('vdocs-field-required');

    const readonlyWrapper = mount(VerdocsFieldDate, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get('input').element.disabled).toBe(true);
  });

  it('renders the final date as local text when done', () => {
    const wrapper = mount(VerdocsFieldDate, { props: { field: sampleField({ value: '2026-08-01' }), done: true } });

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toBe(new Date(2026, 7, 1).toLocaleDateString());
    expect(wrapper.classes()).toContain('vdocs-field-done');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldDate, { props: { field: sampleField(), signerIndex: 1 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });
});
