import { mount } from '@vue/test-utils';
import VerdocsFlag from './VerdocsFlag.vue';

describe('VerdocsFlag', () => {
  it('renders its label and handles body clicks', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VerdocsFlag, { props: { label: 'FILL' }, attrs: { onClick } });

    expect(wrapper.text()).toContain('FILL');

    await wrapper.trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('emits skip without triggering the body click handler', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VerdocsFlag, { props: { label: 'FILL', showSkip: true }, attrs: { onClick } });

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('skip')).toHaveLength(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('omits the skip link unless requested', () => {
    const wrapper = mount(VerdocsFlag, { props: { label: 'NEXT', variant: 'next' } });

    expect(wrapper.text()).toContain('NEXT');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('defaults to the FILL label', () => {
    const wrapper = mount(VerdocsFlag);

    expect(wrapper.text()).toContain('FILL');
  });
});
