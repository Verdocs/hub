import { mount } from '@vue/test-utils';
import VerdocsToolbarIcon from './VerdocsToolbarIcon.vue';

describe('VerdocsToolbarIcon', () => {
  it('renders the slotted icon in a button named for its tooltip text and handles clicks', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VerdocsToolbarIcon, {
      props: { text: 'Add signature' },
      attrs: { onClick },
      slots: { default: '<svg />' },
    });

    expect(wrapper.get('button').attributes('aria-label')).toBe('Add signature');
    expect(wrapper.find('svg').exists()).toBe(true);

    await wrapper.get('button').trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows the tooltip on hover and hides it again', async () => {
    const wrapper = mount(VerdocsToolbarIcon, { props: { text: 'Add signature' }, slots: { default: '<svg />' } });

    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);

    await wrapper.get('button').trigger('mouseenter');
    expect(wrapper.get('[role="tooltip"]').text()).toBe('Add signature');

    await wrapper.get('button').trigger('mouseleave');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('shows the tooltip on focus and hides it on blur', async () => {
    const wrapper = mount(VerdocsToolbarIcon, { props: { text: 'Add signature' }, slots: { default: '<svg />' } });

    await wrapper.get('button').trigger('focus');
    expect(wrapper.get('[role="tooltip"]').text()).toBe('Add signature');

    await wrapper.get('button').trigger('blur');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('never shows an empty tooltip', async () => {
    const wrapper = mount(VerdocsToolbarIcon, { slots: { default: '<svg />' } });

    await wrapper.get('button').trigger('mouseenter');
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
  });

  it('does not fire clicks when disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VerdocsToolbarIcon, {
      props: { text: 'Add signature' },
      attrs: { disabled: true, onClick },
      slots: { default: '<svg />' },
    });

    await wrapper.get('button').trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });
});
