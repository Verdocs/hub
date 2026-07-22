import { mount } from '@vue/test-utils';
import VerdocsToggleButton from './VerdocsToggleButton.vue';

describe('VerdocsToggleButton', () => {
  it('reflects the pressed state and requests the opposite on click', async () => {
    const wrapper = mount(VerdocsToggleButton, { props: { label: 'Bold', active: false } });

    const button = wrapper.get('button');
    expect(button.attributes('aria-pressed')).toBe('false');

    await button.trigger('click');
    expect(wrapper.emitted('update:active')).toEqual([ [ true ] ]);
  });

  it('renders pressed when active', () => {
    const wrapper = mount(VerdocsToggleButton, { props: { label: 'Bold', active: true } });

    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true');
    expect(wrapper.text()).toContain('Bold');
  });

  it('uses the label as the accessible name for icon buttons', () => {
    const wrapper = mount(VerdocsToggleButton, {
      props: { label: 'Bold', active: false },
      slots: { default: '<svg aria-hidden="true" />' },
    });

    const button = wrapper.get('button');
    expect(button.attributes('aria-label')).toBe('Bold');
    expect(button.text()).not.toContain('Bold');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('does not let a toggle double as a click on its host', async () => {
    const hostClick = vi.fn();
    const host = document.createElement('div');
    host.addEventListener('click', hostClick);
    document.body.appendChild(host);

    const wrapper = mount(VerdocsToggleButton, { props: { label: 'Bold' }, attachTo: host });

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('update:active')).toEqual([ [ true ] ]);
    expect(hostClick).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
