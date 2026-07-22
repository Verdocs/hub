import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldInitial from './VerdocsFieldInitial.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'recipient-1-initial-1',
  role_name: 'Recipient 1',
  type: 'initial',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 520,
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

describe('VerdocsFieldInitial', () => {
  it('renders the initialing affordance and reports clicks when empty', async () => {
    const wrapper = mount(VerdocsFieldInitial, { props: { field: sampleField() } });

    const button = wrapper.get('button');
    expect(button.text()).toBe('Initial');

    await button.trigger('click');

    expect(wrapper.emitted('beginSigning')).toEqual([ [] ]);
  });

  it('does not begin signing when disabled', async () => {
    const wrapper = mount(VerdocsFieldInitial, { props: { field: sampleField(), disabled: true } });

    const button = wrapper.get('button');
    expect(button.element.disabled).toBe(true);
    await button.trigger('click');

    expect(wrapper.emitted('beginSigning')).toBeUndefined();
  });

  it('renders the adopted initials image instead of the affordance when filled', () => {
    const wrapper = mount(VerdocsFieldInitial, { props: { field: sampleField(), initialUrl: FAKE_URL } });

    expect(wrapper.get('img').attributes('src')).toBe(FAKE_URL);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-filled');
  });

  it('renders only the final image when done', () => {
    const wrapper = mount(VerdocsFieldInitial, { props: { field: sampleField(), done: true, initialUrl: FAKE_URL } });

    expect(wrapper.get('img').attributes('src')).toBe(FAKE_URL);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.classes()).toContain('vdocs-done');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldInitial, { props: { field: sampleField(), signerIndex: 2 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-3');
  });

  it('marks the required and focused state classes on the wrapper', () => {
    const wrapper = mount(VerdocsFieldInitial, { props: { field: sampleField({ required: true }), focused: true } });

    expect(wrapper.classes()).toContain('vdocs-required');
    expect(wrapper.classes()).toContain('vdocs-focused');
  });
});
