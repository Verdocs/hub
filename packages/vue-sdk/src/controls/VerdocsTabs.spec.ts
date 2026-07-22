import { mount } from '@vue/test-utils';
import VerdocsTabs from './VerdocsTabs.vue';

const tabs = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three', disabled: true },
  { id: 'four', label: 'Four' },
];

describe('VerdocsTabs', () => {
  it('renders a tablist with aria-selected and a roving tabindex', () => {
    const wrapper = mount(VerdocsTabs, { props: { tabs, selectedTab: 1 } });

    expect(wrapper.find('[role="tablist"]').exists()).toBe(true);

    const rendered = wrapper.findAll('[role="tab"]');
    expect(rendered).toHaveLength(4);
    expect(rendered[0]!.attributes('aria-selected')).toBe('false');
    expect(rendered[1]!.attributes('aria-selected')).toBe('true');
    expect(rendered[0]!.attributes('tabindex')).toBe('-1');
    expect(rendered[1]!.attributes('tabindex')).toBe('0');
    expect(rendered[2]!.attributes('disabled')).toBeDefined();
  });

  it('emits selectTab and update:selectedTab on click', async () => {
    const wrapper = mount(VerdocsTabs, { props: { tabs, selectedTab: 0 } });

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click');
    expect(wrapper.emitted('selectTab')).toEqual([ [ tabs[1], 1 ] ]);
    expect(wrapper.emitted('update:selectedTab')).toEqual([ [ 1 ] ]);
    expect(wrapper.findAll('[role="tab"]')[1]!.attributes('aria-selected')).toBe('true');
  });

  it('ignores clicks on disabled tabs', async () => {
    const wrapper = mount(VerdocsTabs, { props: { tabs, selectedTab: 0 } });

    await wrapper.findAll('[role="tab"]')[2]!.trigger('click');
    expect(wrapper.emitted('selectTab')).toBeUndefined();
  });

  it('moves selection with the keyboard, skipping disabled tabs and wrapping', async () => {
    const wrapper = mount(VerdocsTabs, { props: { tabs, selectedTab: 1 }, attachTo: document.body });
    const rendered = wrapper.findAll('[role="tab"]');

    await rendered[1]!.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('selectTab')?.at(-1)).toEqual([ tabs[3], 3 ]);
    expect(document.activeElement).toBe(rendered[3]!.element);

    await rendered[3]!.trigger('keydown', { key: 'Home' });
    expect(wrapper.emitted('selectTab')?.at(-1)).toEqual([ tabs[0], 0 ]);
    expect(document.activeElement).toBe(rendered[0]!.element);

    await rendered[0]!.trigger('keydown', { key: 'ArrowLeft' });
    expect(wrapper.emitted('selectTab')?.at(-1)).toEqual([ tabs[3], 3 ]);
    expect(wrapper.emitted('selectTab')).toHaveLength(3);

    wrapper.unmount();
  });
});
