import { mount } from '@vue/test-utils';
import type { IOrganization, ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import VerdocsTemplateCard from './VerdocsTemplateCard.vue';

const sampleTemplate = {
  id: 't-1',
  name: 'Onboarding Packet',
  counter: 12,
  star_counter: 4,
  organization: { id: 'o-1', name: 'Acme Document Co' } as IOrganization,
  documents: [ { id: 'd-1', pages: 3 } as ITemplateDocument ],
} as ITemplate;

describe('VerdocsTemplateCard', () => {
  it('renders the name, organization, and counts', () => {
    const wrapper = mount(VerdocsTemplateCard, { props: { template: sampleTemplate } });

    expect(wrapper.text()).toContain('Onboarding Packet');
    expect(wrapper.text()).toContain('Acme Document Co');
    expect(wrapper.text()).toContain('4');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('12');
  });

  it('falls back to Public and one page when relations are missing', () => {
    const wrapper = mount(VerdocsTemplateCard, {
      props: { template: { ...sampleTemplate, organization: undefined, documents: undefined } as ITemplate },
    });

    expect(wrapper.text()).toContain('Public');
    expect(wrapper.text()).toContain('1');
  });

  it('emits select with the template when the card is clicked', async () => {
    const wrapper = mount(VerdocsTemplateCard, { props: { template: sampleTemplate } });

    await wrapper.trigger('click');

    const [ template ] = wrapper.emitted('select')![0] as [ITemplate];
    expect(template.id).toBe('t-1');
  });
});
