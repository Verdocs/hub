import { h } from 'vue';
import { mount } from '@vue/test-utils';
import type { IToggleButton } from './VerdocsToggle.vue';
import VerdocsToggle from './VerdocsToggle.vue';

const buttons: IToggleButton[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
];

describe('VerdocsToggle', () => {
  it('renders a labeled group with the first button selected by default', () => {
    const wrapper = mount(VerdocsToggle, { props: { label: 'View', buttons } });

    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('View');
    expect(wrapper.get('button[aria-label="One"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="Two"]').attributes('aria-pressed')).toBe('false');
  });

  it('renders each button face through the icon scoped slot', () => {
    const wrapper = mount(VerdocsToggle, {
      props: { label: 'View', buttons },
      slots: {
        icon: (params: { button: IToggleButton; index: number }) => h('svg', { 'data-icon': params.button.id }),
      },
    });

    expect(wrapper.find('[data-icon="one"]').exists()).toBe(true);
    expect(wrapper.find('[data-icon="two"]').exists()).toBe(true);
  });

  it('moves the selection on click, emitting buttonSelected and update:selection', async () => {
    const wrapper = mount(VerdocsToggle, { props: { label: 'View', buttons } });

    await wrapper.get('button[aria-label="Two"]').trigger('click');

    expect(wrapper.get('button[aria-label="Two"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="One"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.emitted('buttonSelected')).toEqual([ [ buttons[1], 1 ] ]);
    expect(wrapper.emitted('update:selection')).toEqual([ [ 1 ] ]);
  });

  it('leaves the selection to the parent when controlled', async () => {
    const wrapper = mount(VerdocsToggle, {
      props: { label: 'View', buttons, selection: 0, 'onUpdate:selection': () => undefined },
    });

    await wrapper.get('button[aria-label="Two"]').trigger('click');

    expect(wrapper.emitted('update:selection')).toEqual([ [ 1 ] ]);
    expect(wrapper.get('button[aria-label="One"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="Two"]').attributes('aria-pressed')).toBe('false');
  });
});
