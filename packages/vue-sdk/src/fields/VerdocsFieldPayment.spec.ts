import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldPayment from './VerdocsFieldPayment.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'recipient-1-payment-1',
  role_name: 'Recipient 1',
  type: 'payment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 560,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldPayment', () => {
  it('renders the payment affordance and reports clicks when unpaid', async () => {
    const wrapper = mount(VerdocsFieldPayment, { props: { field: sampleField() } });

    const button = wrapper.get('button[aria-label="Payment"]');
    expect(button.text()).toBe('$');

    await button.trigger('click');

    expect(wrapper.emitted('beginPayment')).toEqual([ [] ]);
  });

  it('does not begin payment when disabled', async () => {
    const wrapper = mount(VerdocsFieldPayment, { props: { field: sampleField(), disabled: true } });

    const button = wrapper.get('button');
    expect(button.element.disabled).toBe(true);
    await button.trigger('click');

    expect(wrapper.emitted('beginPayment')).toBeUndefined();
  });

  it('renders the paid treatment instead of the affordance when paid', () => {
    const wrapper = mount(VerdocsFieldPayment, { props: { field: sampleField(), paid: true } });

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Paid');
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-filled');
  });

  it('renders the paid treatment when done', () => {
    const wrapper = mount(VerdocsFieldPayment, { props: { field: sampleField(), done: true } });

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('Paid');
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-done');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldPayment, { props: { field: sampleField(), signerIndex: 1 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });

  it('marks the field with the disabled state class when disabled', () => {
    const wrapper = mount(VerdocsFieldPayment, { props: { field: sampleField(), disabled: true } });

    expect(wrapper.classes()).toContain('vdocs-disabled');
  });
});
