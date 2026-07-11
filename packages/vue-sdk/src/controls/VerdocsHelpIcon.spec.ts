import { mount } from '@vue/test-utils';
import VerdocsHelpIcon from './VerdocsHelpIcon.vue';

describe('VerdocsHelpIcon', () => {
  it('shows the tooltip on hover and hides it again', async () => {
    const wrapper = mount(VerdocsHelpIcon, { slots: { default: 'Sample help text' } });

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);

    await wrapper.get('[role="img"]').trigger('mouseenter');
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Sample help text');

    await wrapper.get('[role="img"]').trigger('mouseleave');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('shows the tooltip on keyboard focus and hides it on blur', async () => {
    const wrapper = mount(VerdocsHelpIcon, { slots: { default: 'Keyboard help' } });

    await wrapper.get('[role="img"]').trigger('focus');
    expect(wrapper.get('[role="tooltip"]').text()).toContain('Keyboard help');

    await wrapper.get('[role="img"]').trigger('blur');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('renders the standard help icon by default', () => {
    const wrapper = mount(VerdocsHelpIcon);

    expect(wrapper.get('[role="img"]').find('svg').exists()).toBe(true);
  });

  it('renders a caller-supplied icon in place of the default', () => {
    const wrapper = mount(VerdocsHelpIcon, {
      slots: { default: 'Custom', icon: '<svg data-testid="custom-icon" />' },
    });

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true);
  });
});
