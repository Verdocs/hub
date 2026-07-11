import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldCheckbox from './VerdocsFieldCheckbox.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-checkbox-1',
  role_name: 'Recipient 1',
  type: 'checkbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 16,
  height: 16,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'purchase-options',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldCheckbox', () => {
  it('renders unchecked when the field has no value', () => {
    const wrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField() } });

    const box = wrapper.get('input');
    expect(box.attributes('type')).toBe('checkbox');
    expect(box.attributes('aria-label')).toBe('Buyer-checkbox-1');
    expect(box.element.checked).toBe(false);
  });

  it('renders checked from the field value', () => {
    const wrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField({ value: 'true' }) } });

    expect(wrapper.get('input').element.checked).toBe(true);
  });

  it('emits fieldChange with the new checked state', async () => {
    // jsdom only fires the activation input/change events for inputs connected
    // to the document, so click-driven tests attach; setup.ts clears the body.
    const wrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField() }, attachTo: document.body });

    const box = wrapper.get('input');
    await box.trigger('click');
    expect(box.element.checked).toBe(true);

    await box.trigger('click');
    expect(box.element.checked).toBe(false);

    expect(wrapper.emitted('fieldChange')).toEqual([ [ true ], [ false ] ]);
  });

  it('blocks toggling when disabled or the field is readonly', async () => {
    const wrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField(), disabled: true }, attachTo: document.body });

    const box = wrapper.get('input');
    expect(box.element.disabled).toBe(true);
    await box.trigger('click');

    expect(box.element.checked).toBe(false);
    expect(wrapper.emitted('fieldChange')).toBeUndefined();

    const readonlyWrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get('input').element.disabled).toBe(true);
  });

  it('renders the final glyph instead of an input when done', () => {
    const checkedWrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField({ value: 'true' }), done: true } });
    expect(checkedWrapper.find('input').exists()).toBe(false);
    expect(checkedWrapper.get('[role="img"]').attributes('aria-label')).toBe('Checked');

    const uncheckedWrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField(), done: true } });
    expect(uncheckedWrapper.get('[role="img"]').attributes('aria-label')).toBe('Unchecked');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldCheckbox, { props: { field: sampleField(), signerIndex: 1 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });
});
