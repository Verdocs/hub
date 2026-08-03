import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import type { ITemplate, ITemplateField } from '@verdocs/js-sdk';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsTemplateFieldProperties from './VerdocsTemplateFieldProperties.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import { TEST_API_BASE } from '../../test/support';

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'tpl-1',
  document_id: 'doc-1',
  type: 'textbox',
  required: true,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: 'Legal name',
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

const makeTemplate = (field: ITemplateField): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    roles: [ { name: 'Recipient 1', sequence: 1 }, { name: 'Recipient 2', sequence: 2 } ],
    fields: [ field ],
  }) as ITemplate;

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(button => button.text() === text)!;

describe('VerdocsTemplateFieldProperties', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
  });

  afterEach(() => mock.restore());

  const mountPanel = async (field: ITemplateField, props = {}) => {
    mock.onGet('/v2/templates/tpl-1').reply(200, makeTemplate(field));
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplateFieldProperties, {
      props: { templateId: 'tpl-1', fieldName: field.name, ...props },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('seeds the form from the field settings', async () => {
    const wrapper = await mountPanel(makeField());

    expect(wrapper.text()).toContain('Textbox Settings');
    expect((wrapper.find('input[placeholder="Field Name..."]').element as HTMLInputElement).value).toBe('textboxP1-1');
    expect((wrapper.find('input[placeholder="Optional Label..."]').element as HTMLInputElement).value).toBe('Legal name');
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('Recipient 1');
    expect((wrapper.findAll('input[type="checkbox"]')[0]!.element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.findAll('input[type="checkbox"]')[1]!.element as HTMLInputElement).checked).toBe(false);
    expect(buttonByText(wrapper, 'Save').attributes('disabled')).toBeDefined();
  });

  it('saves edited settings and reports them', async () => {
    mock.onPatch('/v2/fields/tpl-1/textboxP1-1').reply(config => [ 200, { ...makeField(), ...JSON.parse(String(config.data)) } ]);

    const wrapper = await mountPanel(makeField());

    await wrapper.find('input[placeholder="Pre-filled value..."]').setValue('Jane Smith');
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true);
    await buttonByText(wrapper, 'Save').trigger('click');
    await flushPromises();

    expect(JSON.parse(String(mock.history.patch[0]!.data))).toMatchObject({ readonly: true, default: 'Jane Smith', required: true });
    expect(wrapper.emitted('settingsChanged')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('blocks saving a read-only field without a default value', async () => {
    const wrapper = await mountPanel(makeField());

    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true);

    expect(buttonByText(wrapper, 'Save').attributes('disabled')).toBeDefined();
    expect(wrapper.find('input[placeholder="Default value required"]').exists()).toBe(true);
  });

  it('deletes the field and reports the deletion', async () => {
    mock.onDelete('/v2/fields/tpl-1/textboxP1-1').reply(200, {});

    const wrapper = await mountPanel(makeField());

    await wrapper.find('button[aria-label="Delete field"]').trigger('click');
    await flushPromises();

    expect(mock.history.delete.some(request => request.url === '/v2/fields/tpl-1/textboxP1-1')).toBe(true);
    expect(wrapper.emitted('fieldDeleted')![0]).toEqual([ { templateId: 'tpl-1', fieldName: 'textboxP1-1' } ]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('disables deletion once the form is dirty', async () => {
    const wrapper = await mountPanel(makeField());

    expect(wrapper.find('button[aria-label="Delete field"]').attributes('disabled')).toBeUndefined();

    await wrapper.find('input[placeholder="Optional Label..."]').setValue('Legal name!');
    expect(wrapper.find('button[aria-label="Delete field"]').attributes('disabled')).toBeDefined();
  });

  it('edits dropdown options with a trailing blank row and requires one option to save', async () => {
    mock.onPatch('/v2/fields/tpl-1/dropdownP1-1').reply(config => [ 200, JSON.parse(String(config.data)) ]);

    const wrapper = await mountPanel(makeField({ name: 'dropdownP1-1', type: 'dropdown', label: null, placeholder: null, options: [ { id: 'yes', label: 'Yes' } ] }));

    expect(wrapper.text()).toContain('Dropdown Settings');
    expect((wrapper.find('input[aria-label="Option 1 ID"]').element as HTMLInputElement).value).toBe('yes');
    expect((wrapper.find('input[aria-label="Option 2 ID"]').element as HTMLInputElement).value).toBe('');

    await wrapper.find('button[aria-label="Remove option 1"]').trigger('click');
    expect(buttonByText(wrapper, 'Save').attributes('disabled')).toBeDefined();

    await wrapper.find('input[aria-label="Option 1 ID"]').setValue('no');
    await wrapper.find('input[aria-label="Option 1 label"]').setValue('No');
    await buttonByText(wrapper, 'Save').trigger('click');
    await flushPromises();

    expect(JSON.parse(String(mock.history.patch[0]!.data))).toMatchObject({ options: [ { id: 'no', label: 'No' } ] });
  });

  it('flips to the help view when helpText is provided', async () => {
    const wrapper = await mountPanel(makeField(), { helpText: 'Text boxes collect a single line of text.' });

    await wrapper.find('button[aria-label="Show help"]').trigger('click');
    expect(wrapper.text()).toContain('Text boxes collect a single line of text.');
    expect(wrapper.find('input[placeholder="Field Name..."]').exists()).toBe(false);

    await wrapper.find('button[aria-label="Hide help"]').trigger('click');
    expect(wrapper.find('input[placeholder="Field Name..."]').exists()).toBe(true);
  });
});
