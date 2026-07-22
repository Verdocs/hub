import { mount } from '@vue/test-utils';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import VerdocsFieldDropdown from './VerdocsFieldDropdown.vue';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-dropdown-1',
  role_name: 'Recipient 1',
  type: 'dropdown',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 500,
  width: 85,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: [
    { id: 'purchase', label: 'Purchase' },
    { id: 'refinance', label: 'Refinance' },
    { id: 'cash-out', label: 'Cash Out' },
  ],
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldDropdown', () => {
  it('renders the options and the current value', () => {
    const wrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField({ value: 'refinance' }) } });

    const select = wrapper.get('select');
    expect(select.attributes('aria-label')).toBe('Buyer-dropdown-1');
    expect(select.element.value).toBe('refinance');

    const labels = wrapper.findAll('option').map(option => option.text());
    expect(labels).toEqual([ 'Select...', 'Purchase', 'Refinance', 'Cash Out' ]);
  });

  it('emits fieldChange with the selected option id', async () => {
    const wrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField() } });

    const select = wrapper.get('select');
    await select.setValue('cash-out');

    expect(select.element.value).toBe('cash-out');
    expect(wrapper.emitted('fieldChange')).toEqual([ [ 'cash-out' ] ]);
  });

  it('disables the select when disabled or the field is readonly', () => {
    const wrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField(), disabled: true } });
    expect(wrapper.get('select').element.disabled).toBe(true);

    const readonlyWrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField({ readonly: true }) } });
    expect(readonlyWrapper.get('select').element.disabled).toBe(true);
  });

  it('falls back to an N/A option when the field has none', () => {
    const wrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField({ options: null }) } });

    const labels = wrapper.findAll('option').map(option => option.text());
    expect(labels).toEqual([ 'Select...', 'N/A' ]);
  });

  it('renders the value as plain text when done', () => {
    const wrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField({ value: 'refinance' }), done: true } });

    expect(wrapper.find('select').exists()).toBe(false);
    expect(wrapper.text()).toBe('refinance');
  });

  it('applies the signer color class for the signer index', () => {
    const wrapper = mount(VerdocsFieldDropdown, { props: { field: sampleField(), signerIndex: 1 } });

    expect(wrapper.classes()).toContain('vdocs-field');
    expect(wrapper.classes()).toContain('vdocs-signer-2');
  });
});
