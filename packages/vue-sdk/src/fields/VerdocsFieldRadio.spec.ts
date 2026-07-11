import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldRadio from './VerdocsFieldRadio.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-radio-1',
  role_name: 'Recipient 1',
  type: 'radio',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 140,
  y: 360,
  width: 16,
  height: 16,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'loan-purpose',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldRadio', () => {
  it('renders unselected under the field group when the field has no value', () => {
    const wrapper = mount(VerdocsFieldRadio, { props: { field: sampleField() } });

    const button = wrapper.get('input');
    expect(button.attributes('type')).toBe('radio');
    expect(button.attributes('name')).toBe('loan-purpose');
    expect(button.element.checked).toBe(false);
  });

  it('renders selected from the field value', () => {
    const wrapper = mount(VerdocsFieldRadio, { props: { field: sampleField({ value: 'true' }) } });

    expect(wrapper.get('input').element.checked).toBe(true);
  });

  it('emits fieldChange with the field name when selected', async () => {
    // jsdom only fires the activation input/change events for inputs connected
    // to the document, so click-driven tests attach; setup.ts clears the body.
    const wrapper = mount(VerdocsFieldRadio, { props: { field: sampleField() }, attachTo: document.body });

    const button = wrapper.get('input');
    await button.trigger('click');

    expect(button.element.checked).toBe(true);
    expect(wrapper.emitted('fieldChange')).toEqual([ [ 'Buyer-radio-1' ] ]);
  });

  it('blocks selection when disabled or the field is readonly', async () => {
    const wrapper = mount(VerdocsFieldRadio, { props: { field: sampleField(), disabled: true }, attachTo: document.body });

    const button = wrapper.get('input');
    expect(button.element.disabled).toBe(true);
    await button.trigger('click');

    expect(button.element.checked).toBe(false);
    expect(wrapper.emitted('fieldChange')).toBeUndefined();

    const readonlyWrapper = mount(VerdocsFieldRadio, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get('input').element.disabled).toBe(true);
  });

  it('renders the final glyph instead of an input when done', () => {
    const selectedWrapper = mount(VerdocsFieldRadio, { props: { field: sampleField({ value: 'true' }), done: true } });
    expect(selectedWrapper.find('input').exists()).toBe(false);
    expect(selectedWrapper.get('[role="img"]').attributes('aria-label')).toBe('Selected');

    const unselectedWrapper = mount(VerdocsFieldRadio, { props: { field: sampleField(), done: true } });
    expect(unselectedWrapper.get('[role="img"]').attributes('aria-label')).toBe('Not selected');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldRadio, { props: { field: sampleField(), signerIndex: 3 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-4');
  });
});
