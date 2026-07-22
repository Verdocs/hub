import { mount } from '@vue/test-utils';
import VerdocsRadioButton from './VerdocsRadioButton.vue';

describe('VerdocsRadioButton', () => {
  it('renders a labeled radio button, unselected by default', () => {
    const wrapper = mount(VerdocsRadioButton, { props: { label: 'Typed' }, attrs: { name: 'mode', value: 'type' } });

    const radio = wrapper.get('input');
    expect(wrapper.text()).toContain('Typed');
    expect(radio.attributes('type')).toBe('radio');
    expect(radio.attributes('name')).toBe('mode');
    expect(radio.element.checked).toBe(false);
  });

  it('selects on click and emits update:checked', async () => {
    // jsdom only fires the activation input/change events for inputs connected
    // to the document, so click-driven tests attach; setup.ts clears the body.
    const wrapper = mount(VerdocsRadioButton, {
      props: { label: 'Drawn' },
      attrs: { name: 'mode', value: 'draw' },
      attachTo: document.body,
    });

    const radio = wrapper.get('input');
    await radio.trigger('click');

    expect(radio.element.checked).toBe(true);
    expect(wrapper.emitted('update:checked')).toEqual([ [ true ] ]);
  });

  it('follows the checked model when the parent drives it', async () => {
    const wrapper = mount(VerdocsRadioButton, {
      props: { label: 'Controlled', checked: true, 'onUpdate:checked': () => undefined },
    });

    const radio = wrapper.get('input');
    expect(radio.element.checked).toBe(true);

    await wrapper.setProps({ checked: false });
    expect(radio.element.checked).toBe(false);
  });

  it('cannot be selected when disabled', async () => {
    const wrapper = mount(VerdocsRadioButton, { props: { label: 'Locked' }, attrs: { disabled: true }, attachTo: document.body });

    const radio = wrapper.get('input');
    await radio.trigger('click');

    expect(radio.element.checked).toBe(false);
    expect(wrapper.emitted('update:checked')).toBeUndefined();
  });
});
