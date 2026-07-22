import { mount } from '@vue/test-utils';
import VerdocsComponentError from './VerdocsComponentError.vue';

describe('VerdocsComponentError', () => {
  it('announces the message as an alert', () => {
    const wrapper = mount(VerdocsComponentError, { props: { message: 'Something went wrong.' } });

    expect(wrapper.get('[role="alert"]').text()).toBe('Something went wrong.');
  });

  it('renders an updated message', async () => {
    const wrapper = mount(VerdocsComponentError, { props: { message: 'First failure.' } });

    await wrapper.setProps({ message: 'Second failure.' });
    expect(wrapper.get('[role="alert"]').text()).toBe('Second failure.');
  });
});
