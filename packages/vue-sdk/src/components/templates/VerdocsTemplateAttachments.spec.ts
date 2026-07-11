import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import type { ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import VerdocsTemplateAttachments from './VerdocsTemplateAttachments.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import type { ITemplateEvent } from '../../types';

const makeDocument = (overrides: Partial<ITemplateDocument>): ITemplateDocument =>
  ({
    id: 'doc-1',
    name: 'NDA.pdf',
    template_id: 'template-1',
    order: 0,
    pages: 3,
    mime: 'application/pdf',
    size: 12345,
    page_sizes: [],
    ...overrides,
  }) as ITemplateDocument;

const documents = [
  makeDocument({ id: 'doc-1', name: 'NDA.pdf' }),
  makeDocument({ id: 'doc-2', name: 'Exhibit-A.docx', pages: 1, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
];

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({ id: 'template-1', name: 'Lease Agreement', roles: [], fields: [], documents, ...overrides }) as ITemplate;

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(button => button.text() === text)!;
const bodyButtonByText = (text: string) => Array.from(document.body.querySelectorAll('button')).find(button => button.textContent?.trim() === text);

describe('VerdocsTemplateAttachments', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
    document.body.innerHTML = '';
  });

  const mountAttachments = async (template = makeTemplate(), props = {}) => {
    mock.onGet('/v2/templates/template-1').reply(200, template);
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplateAttachments, {
      props: { templateId: 'template-1', ...props },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('lists the template documents', async () => {
    const wrapper = await mountAttachments();

    expect(wrapper.text()).toContain('NDA.pdf');
    expect(wrapper.text()).toContain('Exhibit-A.docx');
    expect(wrapper.find('[title="3 page(s)"]').exists()).toBe(true);
  });

  it('uploads a selected file and reports the change', async () => {
    mock.onPost('/v2/template-documents').reply(200, makeDocument({ id: 'doc-3', name: 'Lease.pdf' }));

    const wrapper = await mountAttachments();

    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { configurable: true, value: [ new File([ 'dummy' ], 'Lease.pdf', { type: 'application/pdf' }) ] });
    await input.trigger('change');
    await flushPromises();

    expect(mock.history.post.some(request => request.url === '/v2/template-documents')).toBe(true);
    expect(wrapper.emitted('attachmentsChanged')).toBeTruthy();
  });

  it('deletes an attachment after the user confirms', async () => {
    mock.onDelete('/v2/template-documents/doc-1').reply(200, makeTemplate());

    const wrapper = await mountAttachments();

    await wrapper.find('button[aria-label="Delete NDA.pdf"]').trigger('click');
    expect(document.body.textContent).toContain('Delete this Attachment?');

    bodyButtonByText('OK')!.click();
    await flushPromises();

    expect(mock.history.delete.some(request => request.url === '/v2/template-documents/doc-1')).toBe(true);
    expect(wrapper.emitted('attachmentsChanged')).toBeTruthy();
  });

  it('refuses to delete the last attachment', async () => {
    const wrapper = await mountAttachments(makeTemplate({ documents: [ documents[0]! ] }));

    await wrapper.find('button[aria-label="Delete NDA.pdf"]').trigger('click');

    expect(document.body.textContent).toContain('Unable to Delete Attachment');
    expect(mock.history.delete).toHaveLength(0);

    bodyButtonByText('OK')!.click();
    await flushPromises();
    expect(document.body.textContent).not.toContain('Unable to Delete Attachment');
  });

  it('emits next with the template and cancel when dismissed', async () => {
    const wrapper = await mountAttachments();

    await buttonByText(wrapper, 'Next').trigger('click');
    const [ event ] = wrapper.emitted('next')![0] as [ITemplateEvent];
    expect(event.template.id).toBe('template-1');

    await buttonByText(wrapper, 'Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('disables Next when the template has no documents', async () => {
    const wrapper = await mountAttachments(makeTemplate({ documents: [] }));

    expect(buttonByText(wrapper, 'Next').attributes('disabled')).toBeDefined();
  });
});
