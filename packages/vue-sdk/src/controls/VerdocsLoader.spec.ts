import { mount } from '@vue/test-utils';
import VerdocsLoader from './VerdocsLoader.vue';

describe('VerdocsLoader', () => {
  it('announces itself as a loading status indicator', () => {
    const wrapper = mount(VerdocsLoader);

    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('Loading');
  });

  it('renders the eight-dot spinner ring', () => {
    const wrapper = mount(VerdocsLoader);

    const ring = wrapper.get('[role="status"]').element.firstElementChild;
    expect(ring?.children).toHaveLength(8);
  });
});
