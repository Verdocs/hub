import { mount } from '@vue/test-utils';
import VerdocsCheckbox from './VerdocsCheckbox.vue';

describe('VerdocsCheckbox', () => {
  it('renders a labeled checkbox, unchecked by default', () => {
    const wrapper = mount(VerdocsCheckbox, { props: { label: 'Accept the terms' } });

    const box = wrapper.get('input');
    expect(wrapper.text()).toContain('Accept the terms');
    expect(box.attributes('type')).toBe('checkbox');
    expect(box.element.checked).toBe(false);
  });

  it('toggles on click and emits update:checked', async () => {
    // jsdom only fires the activation input/change events for inputs connected
    // to the document, so click-driven tests attach; setup.ts clears the body.
    const wrapper = mount(VerdocsCheckbox, { props: { label: 'Accept' }, attachTo: document.body });

    const box = wrapper.get('input');
    await box.trigger('click');
    expect(box.element.checked).toBe(true);

    await box.trigger('click');
    expect(box.element.checked).toBe(false);

    expect(wrapper.emitted('update:checked')).toEqual([ [ true ], [ false ] ]);
  });

  it('follows the checked model when the parent drives it', async () => {
    const wrapper = mount(VerdocsCheckbox, {
      props: { label: 'Controlled', checked: true, 'onUpdate:checked': () => undefined },
    });

    const box = wrapper.get('input');
    expect(box.element.checked).toBe(true);

    await wrapper.setProps({ checked: false });
    expect(box.element.checked).toBe(false);
  });

  it('cannot be toggled when disabled', async () => {
    const wrapper = mount(VerdocsCheckbox, { props: { label: 'Locked' }, attrs: { disabled: true }, attachTo: document.body });

    const box = wrapper.get('input');
    await box.trigger('click');

    expect(box.element.checked).toBe(false);
    expect(wrapper.emitted('update:checked')).toBeUndefined();
  });
});
