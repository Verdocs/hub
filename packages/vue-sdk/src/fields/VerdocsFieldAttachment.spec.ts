import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldAttachment from './VerdocsFieldAttachment.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-attachment-1',
  role_name: 'Recipient 1',
  type: 'attachment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Proof of Insurance',
  prepared: false,
  page: 1,
  x: 100,
  y: 400,
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

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

describe('VerdocsFieldAttachment', () => {
  it('reports a picked file through selectFile', async () => {
    const wrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField() } });

    expect(wrapper.get('button[aria-label="Proof of Insurance"]')).toBeTruthy();

    // jsdom does not implement the file picker, so the selection is injected
    // directly onto the input before firing change.
    const file = pdf('renters-policy.pdf');
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [ file ], configurable: true });
    await input.trigger('change');

    expect(wrapper.emitted('selectFile')).toEqual([ [ file ] ]);
  });

  it('surfaces the attached file name and a delete affordance', async () => {
    const wrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField({ value: 'renters-policy.pdf' }) } });

    expect(wrapper.get('button[aria-label="Proof of Insurance"]').attributes('title')).toBe('renters-policy.pdf');

    await wrapper.get('button[aria-label="Remove attachment"]').trigger('click');

    expect(wrapper.emitted('deleteFile')).toEqual([ [] ]);
  });

  it('deactivates when disabled or the field is readonly', () => {
    const wrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField({ value: 'renters-policy.pdf' }), disabled: true } });
    expect(wrapper.get<HTMLButtonElement>('button[aria-label="Proof of Insurance"]').element.disabled).toBe(true);
    expect(wrapper.find('button[aria-label="Remove attachment"]').exists()).toBe(false);

    const readonlyWrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get<HTMLButtonElement>('button[aria-label="Proof of Insurance"]').element.disabled).toBe(true);
  });

  it('marks required fields on the wrapper', () => {
    const wrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField({ required: true }) } });

    expect(wrapper.classes()).toContain('vdocs-field-required');
  });

  it('renders only a status icon when done', () => {
    const wrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField({ value: 'renters-policy.pdf' }), done: true } });

    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.get('title').text()).toBe('File attached');
    expect(wrapper.classes()).toContain('vdocs-field-done');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldAttachment, { props: { field: sampleField(), signerIndex: 1 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });
});
