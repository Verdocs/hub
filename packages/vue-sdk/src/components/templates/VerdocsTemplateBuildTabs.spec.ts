import { mount } from '@vue/test-utils';
import type { ITemplate } from '@verdocs/js-sdk';
import VerdocsTemplateBuildTabs from './VerdocsTemplateBuildTabs.vue';

const sampleTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    documents: [ { id: 'doc-1' } ],
    roles: [ { name: 'Recipient 1' } ],
    fields: [ { name: 'textboxP1-1' } ],
    ...overrides,
  }) as ITemplate;

const tabByName = (wrapper: ReturnType<typeof mount>, name: string) =>
  wrapper.findAll('[role="tab"]').find(tab => tab.text() === name)!;

describe('VerdocsTemplateBuildTabs', () => {
  it('renders the four builder steps with the selected one marked', () => {
    const wrapper = mount(VerdocsTemplateBuildTabs, { props: { selectedStep: 'fields', template: sampleTemplate() } });

    expect(tabByName(wrapper, 'Attachments').attributes('aria-selected')).toBe('false');
    expect(tabByName(wrapper, 'Workflow').attributes('disabled')).toBeUndefined();
    expect(tabByName(wrapper, 'Fields').attributes('aria-selected')).toBe('true');
    expect(tabByName(wrapper, 'Preview & Send').attributes('disabled')).toBeUndefined();
  });

  it('leaves only Attachments enabled without a template', () => {
    const wrapper = mount(VerdocsTemplateBuildTabs, { props: { selectedStep: 'attachments' } });

    expect(tabByName(wrapper, 'Attachments').attributes('disabled')).toBeUndefined();
    expect(tabByName(wrapper, 'Workflow').attributes('disabled')).toBeDefined();
    expect(tabByName(wrapper, 'Fields').attributes('disabled')).toBeDefined();
    expect(tabByName(wrapper, 'Preview & Send').attributes('disabled')).toBeDefined();
  });

  it('unlocks steps as the template gains documents, roles, and fields', async () => {
    const wrapper = mount(VerdocsTemplateBuildTabs, {
      props: { selectedStep: 'attachments', template: sampleTemplate({ roles: [], fields: [] }) },
    });

    expect(tabByName(wrapper, 'Workflow').attributes('disabled')).toBeUndefined();
    expect(tabByName(wrapper, 'Fields').attributes('disabled')).toBeDefined();

    await wrapper.setProps({ template: sampleTemplate({ fields: [] }) });

    expect(tabByName(wrapper, 'Fields').attributes('disabled')).toBeUndefined();
    expect(tabByName(wrapper, 'Preview & Send').attributes('disabled')).toBeDefined();
  });

  it('emits selectStep with the step id and ignores disabled steps', async () => {
    const wrapper = mount(VerdocsTemplateBuildTabs, {
      props: { selectedStep: 'attachments', template: sampleTemplate({ fields: [] }) },
    });

    await tabByName(wrapper, 'Workflow').trigger('click');
    expect(wrapper.emitted('selectStep')![0]).toEqual([ 'roles' ]);

    await tabByName(wrapper, 'Preview & Send').trigger('click');
    expect(wrapper.emitted('selectStep')).toHaveLength(1);
  });
});
