import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import type { ITemplate, ITemplateDocument, ITemplateField } from '@verdocs/js-sdk';
import VerdocsTemplateFields from './VerdocsTemplateFields.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'tpl-1',
  document_id: 'doc-1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: null,
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    documents: [
      {
        id: 'doc-1',
        name: 'Contract.pdf',
        template_id: 'tpl-1',
        order: 1,
        pages: 1,
        page_sizes: { 1: { width: 612, height: 792 } } as unknown as ITemplateDocument['page_sizes'],
      } as ITemplateDocument,
    ],
    roles: [ { name: 'Recipient 1', sequence: 1 } ],
    fields: [ makeField(), makeField({ name: 'signatureP1-1', type: 'signature', x: 300, y: 400, width: 82, height: 36 }) ],
    ...overrides,
  }) as ITemplate;

const bodyButtonByText = (text: string) => Array.from(document.body.querySelectorAll('button')).find(button => button.textContent?.trim() === text);

describe('VerdocsTemplateFields', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
    mock.onGet(/\/v2\/template-documents\/page-image\//).reply(200, 'https://fake.test/page-1.png');
  });

  afterEach(() => {
    mock.restore();
    document.body.innerHTML = '';
  });

  const mountFields = async (template = makeTemplate(), props = {}) => {
    mock.onGet('/v2/templates/tpl-1').reply(200, template);
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplateFields, {
      props: { templateId: 'tpl-1', ...props },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    // Two settle passes: the template query resolves first, then the page-image
    // queries it unlocks.
    await flushPromises();
    await flushPromises();
    return wrapper;
  };

  it('renders the page image with each field component at its stored position', async () => {
    const wrapper = await mountFields();

    expect(wrapper.find('img').attributes('src')).toBe('https://fake.test/page-1.png');
    expect(wrapper.find('img').attributes('alt')).toBe('Page 1');

    expect(wrapper.find('input[aria-label="textboxP1-1"]').attributes('disabled')).toBeDefined();
    expect(wrapper.findAll('button').find(button => button.text() === 'Signature')!.attributes('disabled')).toBeDefined();

    const textboxWrapper = wrapper.find('[aria-label="textboxP1-1 settings"]').element as HTMLElement;
    expect(textboxWrapper.style.left).toBe('100px');
    expect(textboxWrapper.style.bottom).toBe('200px');
    expect(textboxWrapper.style.width).toBe('150px');
    expect(textboxWrapper.style.height).toBe('15px');

    const signatureWrapper = wrapper.find('[aria-label="signatureP1-1 settings"]').element as HTMLElement;
    expect(signatureWrapper.style.left).toBe('300px');
    expect(signatureWrapper.style.width).toBe('82px');
  });

  it('opens the properties panel on click and saves edits through the API', async () => {
    mock.onPatch('/v2/fields/tpl-1/textboxP1-1').reply(config => [ 200, { ...makeField(), ...JSON.parse(String(config.data)) } ]);

    const wrapper = await mountFields();

    await wrapper.find('[aria-label="textboxP1-1 settings"]').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('Textbox Settings');

    const labelInput = document.body.querySelector('input[placeholder="Optional Label..."]') as HTMLInputElement;
    labelInput.value = 'Legal name';
    labelInput.dispatchEvent(new Event('input'));
    await flushPromises();

    bodyButtonByText('Save')!.click();
    await flushPromises();

    expect(JSON.parse(String(mock.history.patch[0]!.data))).toMatchObject({ name: 'textboxP1-1', label: 'Legal name', role_name: 'Recipient 1' });
    expect(wrapper.emitted('templateUpdated')![0]![0]).toMatchObject({ event: 'updated-field' });
  });

  it('deletes a field from the properties panel', async () => {
    mock.onDelete('/v2/fields/tpl-1/signatureP1-1').reply(200, {});

    const wrapper = await mountFields();

    await wrapper.find('[aria-label="signatureP1-1 settings"]').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('Signature Settings');

    (document.body.querySelector('button[aria-label="Delete field"]') as HTMLButtonElement).click();
    await flushPromises();

    expect(mock.history.delete.some(request => request.url === '/v2/fields/tpl-1/signatureP1-1')).toBe(true);
    expect(wrapper.emitted('templateUpdated')![0]![0]).toMatchObject({ event: 'deleted-field' });
  });

  it('shows the empty state when the template has no documents', async () => {
    const wrapper = await mountFields(makeTemplate({ documents: [], fields: [] }));

    expect(wrapper.text()).toContain('does not have any documents yet');
  });
});
