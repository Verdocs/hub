import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldTextbox from './VerdocsFieldTextbox.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-textbox-1',
  role_name: 'Recipient 1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name...',
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldTextbox', () => {
  it('renders the current value and placeholder', () => {
    const wrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField({ value: 'Jane Roe' }) } });

    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('text');
    expect(input.attributes('placeholder')).toBe('Full name...');
    expect(input.element.value).toBe('Jane Roe');
  });

  it('emits fieldChange with the updated text', async () => {
    const wrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField() } });

    await wrapper.get('input').setValue('Jane Roe');

    expect(wrapper.emitted('fieldChange')).toEqual([ [ 'Jane Roe' ] ]);
  });

  it('caps input length based on the field width', () => {
    const wrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField({ width: 80 }) } });

    expect(wrapper.get('input').attributes('maxlength')).toBe('16');
  });

  it('blocks input when disabled or the field is readonly', () => {
    const wrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField(), disabled: true } });
    expect(wrapper.get('input').element.disabled).toBe(true);

    const readonlyWrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get('input').element.disabled).toBe(true);
  });

  it('renders the value as plain text when done', () => {
    const wrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField({ value: 'Jane Roe' }), done: true } });

    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toBe('Jane Roe');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldTextbox, { props: { field: sampleField(), signerIndex: 2 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-3');
  });
});
