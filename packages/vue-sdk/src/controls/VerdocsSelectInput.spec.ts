import { mount } from '@vue/test-utils';
import VerdocsSelectInput from './VerdocsSelectInput.vue';

const options = [
  { label: 'Contract', value: 'contract' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Purchase Order', value: 'po' },
];

describe('VerdocsSelectInput', () => {
  it('renders a labeled select and updates the model on change', async () => {
    const wrapper = mount(VerdocsSelectInput, { props: { label: 'Document Type', options, modelValue: 'contract' } });

    expect(wrapper.text()).toContain('Document Type');
    expect(wrapper.findAll('option').map(option => option.text())).toEqual([ 'Contract', 'Invoice', 'Purchase Order' ]);
    expect(wrapper.get('select').element.value).toBe('contract');

    await wrapper.get('select').setValue('invoice');
    expect(wrapper.emitted('update:modelValue')).toEqual([ [ 'invoice' ] ]);
  });

  it('marks required fields and passes disabled through to the select', () => {
    const wrapper = mount(VerdocsSelectInput, {
      props: { label: 'Document Type', options, required: true },
      attrs: { disabled: true },
    });

    expect(wrapper.text()).toContain('*');
    expect(wrapper.get('select').attributes('required')).toBeDefined();
    expect(wrapper.get('select').attributes('disabled')).toBeDefined();
  });

  it('sends class to the wrapper and other attrs to the select', () => {
    const wrapper = mount(VerdocsSelectInput, { props: { options }, attrs: { class: 'custom', name: 'doctype' } });

    expect(wrapper.get('label').classes()).toContain('custom');
    expect(wrapper.get('select').attributes('name')).toBe('doctype');
    expect(wrapper.get('select').classes()).not.toContain('custom');
  });

  it('renders the description below the field', () => {
    const wrapper = mount(VerdocsSelectInput, { props: { options, description: 'Pick the closest match.' } });

    expect(wrapper.text()).toContain('Pick the closest match.');
  });
});
