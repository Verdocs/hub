import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import VerdocsMultiSelect from './VerdocsMultiSelect.vue';

const options = [
  { label: 'E-mail', value: 'email' },
  { label: 'SMS', value: 'sms' },
];

describe('VerdocsMultiSelect', () => {
  it('opens the picker and adds a selection without closing', async () => {
    const wrapper = mount(VerdocsMultiSelect, { props: { label: 'Delivery Methods', options, selectedOptions: [] } });

    expect(wrapper.text()).toContain('Select...');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);

    await wrapper.get('button').trigger('click');
    const sms = wrapper.findAll('label').find(label => label.text() === 'SMS');
    await sms!.get('input').setValue(true);

    expect(wrapper.emitted('selectionChanged')).toEqual([ [ [ 'sms' ] ] ]);
    expect(wrapper.emitted('update:selectedOptions')).toEqual([ [ [ 'sms' ] ] ]);
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(2);
  });

  it('summarizes selections in the trigger and removes them on uncheck', async () => {
    const wrapper = mount(VerdocsMultiSelect, {
      props: { label: 'Delivery Methods', options, selectedOptions: [ 'email', 'sms' ] },
    });

    expect(wrapper.text()).not.toContain('Select...');
    expect(wrapper.get('button').text()).toContain('E-mail');
    expect(wrapper.get('button').text()).toContain('SMS');

    await wrapper.get('button').trigger('click');
    const email = wrapper.findAll('label').find(label => label.text() === 'E-mail');
    expect(email!.get('input').element.checked).toBe(true);

    await email!.get('input').setValue(false);
    expect(wrapper.emitted('selectionChanged')).toEqual([ [ [ 'sms' ] ] ]);
  });

  it('shows a placeholder chip for values without a matching option', () => {
    const wrapper = mount(VerdocsMultiSelect, { props: { options, selectedOptions: [ 'fax' ] } });

    expect(wrapper.get('button').text()).toContain('Unknown');
  });

  it('closes on outside clicks and on Escape', async () => {
    const wrapper = mount(VerdocsMultiSelect, { props: { label: 'Delivery Methods', options } });

    await wrapper.get('button').trigger('click');
    expect(wrapper.find('[role="group"]').exists()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(wrapper.find('[role="group"]').exists()).toBe(false);

    await wrapper.get('button').trigger('click');
    expect(wrapper.find('[role="group"]').exists()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(wrapper.find('[role="group"]').exists()).toBe(false);
  });
});
