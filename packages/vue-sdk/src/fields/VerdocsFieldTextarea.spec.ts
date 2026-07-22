import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldTextarea from './VerdocsFieldTextarea.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-textarea-1',
  role_name: 'Recipient 1',
  type: 'textarea',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Notes',
  prepared: false,
  page: 1,
  x: 100,
  y: 240,
  width: 150,
  height: 45,
  default: null,
  placeholder: null,
  multiline: true,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldTextarea', () => {
  it('renders the current value with the signer wrapper class', () => {
    const wrapper = mount(VerdocsFieldTextarea, { props: { field: sampleField({ value: 'Keys under the mat' }), signerIndex: 1 } });

    expect(wrapper.get('textarea').element.value).toBe('Keys under the mat');
    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });

  it('reports edits through fieldChange', async () => {
    const wrapper = mount(VerdocsFieldTextarea, { props: { field: sampleField() } });

    await wrapper.get('textarea').setValue('Back gate code is 4411');

    expect(wrapper.emitted('fieldChange')).toEqual([ [ 'Back gate code is 4411' ] ]);
  });

  it('disables input when disabled or the field is readonly', () => {
    const wrapper = mount(VerdocsFieldTextarea, { props: { field: sampleField(), disabled: true } });
    expect(wrapper.get('textarea').element.disabled).toBe(true);
    expect(wrapper.classes()).toContain('vdocs-field-disabled');

    const readonlyWrapper = mount(VerdocsFieldTextarea, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get('textarea').element.disabled).toBe(true);
  });

  it('marks required fields on the input and the wrapper', () => {
    const wrapper = mount(VerdocsFieldTextarea, { props: { field: sampleField({ required: true }) } });

    expect(wrapper.get('textarea').element.required).toBe(true);
    expect(wrapper.classes()).toContain('vdocs-field-required');
  });

  it('renders the final value without an input when done', () => {
    const wrapper = mount(VerdocsFieldTextarea, { props: { field: sampleField({ value: 'Keys under the mat' }), done: true } });

    expect(wrapper.find('textarea').exists()).toBe(false);
    expect(wrapper.text()).toBe('Keys under the mat');
    expect(wrapper.classes()).toContain('vdocs-field-done');
  });
});
