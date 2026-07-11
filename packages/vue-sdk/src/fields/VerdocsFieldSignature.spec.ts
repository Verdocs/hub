import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldSignature from './VerdocsFieldSignature.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'recipient-1-signature-1',
  role_name: 'Recipient 1',
  type: 'signature',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 480,
  width: 83,
  height: 36,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const FAKE_URL = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';

describe('VerdocsFieldSignature', () => {
  it('renders the signing affordance and reports clicks when unsigned', async () => {
    const wrapper = mount(VerdocsFieldSignature, { props: { field: sampleField() } });

    const button = wrapper.get('button');
    expect(button.text()).toBe('Signature');

    await button.trigger('click');

    expect(wrapper.emitted('beginSigning')).toEqual([ [] ]);
  });

  it('does not begin signing when disabled', async () => {
    const wrapper = mount(VerdocsFieldSignature, { props: { field: sampleField(), disabled: true } });

    const button = wrapper.get('button');
    expect(button.element.disabled).toBe(true);
    await button.trigger('click');

    expect(wrapper.emitted('beginSigning')).toBeUndefined();
  });

  it('renders the adopted signature image instead of the affordance when signed', () => {
    const wrapper = mount(VerdocsFieldSignature, { props: { field: sampleField(), signatureUrl: FAKE_URL } });

    expect(wrapper.get('img').attributes('src')).toBe(FAKE_URL);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-filled');
  });

  it('renders only the final image when done', () => {
    const wrapper = mount(VerdocsFieldSignature, { props: { field: sampleField(), done: true, signatureUrl: FAKE_URL } });

    expect(wrapper.get('img').attributes('src')).toBe(FAKE_URL);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-done');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldSignature, { props: { field: sampleField(), signerIndex: 1 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });

  it('marks the required and focused state classes on the wrapper', () => {
    const wrapper = mount(VerdocsFieldSignature, { props: { field: sampleField({ required: true }), focused: true } });

    expect(wrapper.classes()).toContain('vdocs-required');
    expect(wrapper.classes()).toContain('vdocs-focused');
  });
});
