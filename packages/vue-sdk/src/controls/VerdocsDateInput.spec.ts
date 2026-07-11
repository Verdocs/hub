import { mount } from '@vue/test-utils';
import VerdocsDateInput from './VerdocsDateInput.vue';

describe('VerdocsDateInput', () => {
  it('renders a labeled date input and updates the model with ISO dates', async () => {
    const wrapper = mount(VerdocsDateInput, { props: { label: 'Expiration Date' } });

    expect(wrapper.text()).toContain('Expiration Date');
    expect(wrapper.get('input').attributes('type')).toBe('date');

    await wrapper.get('input').setValue('2026-07-04');
    expect(wrapper.emitted('update:modelValue')).toEqual([ [ '2026-07-04' ] ]);
  });

  it('shows the bound model value', () => {
    const wrapper = mount(VerdocsDateInput, { props: { modelValue: '2026-01-15' } });

    expect(wrapper.get('input').element.value).toBe('2026-01-15');
  });

  it('marks required fields and passes disabled through to the input', () => {
    const wrapper = mount(VerdocsDateInput, {
      props: { label: 'Effective Date', required: true },
      attrs: { disabled: true },
    });

    expect(wrapper.text()).toContain('*');
    expect(wrapper.get('input').attributes('required')).toBeDefined();
    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
  });

  it('renders the description below the field', () => {
    const wrapper = mount(VerdocsDateInput, { props: { description: 'Dates are stored as yyyy-mm-dd.' } });

    expect(wrapper.text()).toContain('Dates are stored as yyyy-mm-dd.');
  });
});
