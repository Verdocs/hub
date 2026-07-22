import { mount } from '@vue/test-utils';
import VerdocsTemplateTags from './VerdocsTemplateTags.vue';

describe('VerdocsTemplateTags', () => {
  it('renders a chip per tag', () => {
    const wrapper = mount(VerdocsTemplateTags, { props: { tags: [ 'onboarding', 'human-resources', 'signed-2026' ] } });

    const chips = wrapper.findAll('span');
    expect(chips).toHaveLength(3);
    expect(wrapper.text()).toContain('onboarding');
    expect(wrapper.text()).toContain('human-resources');
    expect(wrapper.text()).toContain('signed-2026');
  });

  it('renders an empty container when there are no tags', () => {
    const wrapper = mount(VerdocsTemplateTags);

    expect(wrapper.findAll('span')).toHaveLength(0);
  });

  it('merges host classes onto the root alongside the base class', () => {
    const wrapper = mount(VerdocsTemplateTags, { props: { tags: [ 'legal' ] }, attrs: { class: 'custom-class' } });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('vdocs:font-sans');
  });
});
