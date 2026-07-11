import { mount } from '@vue/test-utils';
import VerdocsSwitch from './VerdocsSwitch.vue';

describe('VerdocsSwitch', () => {
  it('renders an accessible switch, off by default', () => {
    const wrapper = mount(VerdocsSwitch, { props: { label: 'Send reminders' } });

    const sw = wrapper.get('input');
    expect(wrapper.text()).toContain('Send reminders');
    expect(sw.attributes('role')).toBe('switch');
    expect(sw.element.checked).toBe(false);
  });

  it('toggles on click and reports the new value through update:checked', async () => {
    // jsdom only fires the activation input/change events for inputs connected
    // to the document, so click-driven tests attach; setup.ts clears the body.
    const wrapper = mount(VerdocsSwitch, { props: { label: 'Send reminders' }, attachTo: document.body });

    const sw = wrapper.get('input');
    await sw.trigger('click');
    expect(sw.element.checked).toBe(true);

    await sw.trigger('click');
    expect(sw.element.checked).toBe(false);

    expect(wrapper.emitted('update:checked')).toEqual([ [ true ], [ false ] ]);
  });

  it('still fires native change listeners passed through attrs', async () => {
    const onChange = vi.fn();
    const wrapper = mount(VerdocsSwitch, { props: { label: 'Reminders' }, attrs: { onChange }, attachTo: document.body });

    await wrapper.get('input').trigger('click');

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('follows the checked model when the parent drives it', async () => {
    const wrapper = mount(VerdocsSwitch, {
      props: { label: 'Controlled', checked: true, 'onUpdate:checked': () => undefined },
    });

    const sw = wrapper.get('input');
    expect(sw.element.checked).toBe(true);

    await wrapper.setProps({ checked: false });
    expect(sw.element.checked).toBe(false);
  });

  it('ignores clicks when disabled', async () => {
    const wrapper = mount(VerdocsSwitch, { props: { label: 'Locked' }, attrs: { disabled: true }, attachTo: document.body });

    const sw = wrapper.get('input');
    await sw.trigger('click');

    expect(sw.element.checked).toBe(false);
    expect(wrapper.emitted('update:checked')).toBeUndefined();
  });
});
