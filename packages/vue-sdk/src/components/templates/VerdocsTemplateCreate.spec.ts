import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ITemplate } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsTemplateCreate from './VerdocsTemplateCreate.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import { TEST_API_BASE } from '../../test/support';

const created = { id: 't-new', name: 'Lease.pdf' } as ITemplate;

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find(button => button.text() === text)!;

describe('VerdocsTemplateCreate', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
    mock.onPost('/v2/templates').reply(200, created);
  });

  afterEach(() => mock.restore());

  const mountCreate = (props = {}) => {
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return mount(VerdocsTemplateCreate, {
      props,
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
  };

  const setFile = async (wrapper: ReturnType<typeof mountCreate>, file: File) => {
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { configurable: true, value: [ file ] });
    await input.trigger('change');
  };

  it('disables Create until a file is chosen, then prefills the name', async () => {
    const wrapper = mountCreate();

    expect(buttonByText(wrapper, 'Create').attributes('disabled')).toBeDefined();

    await setFile(wrapper, pdf('Lease.pdf'));

    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Lease.pdf');
    expect(buttonByText(wrapper, 'Create').attributes('disabled')).toBeUndefined();
  });

  it('keeps a name the user typed when a file is chosen later', async () => {
    const wrapper = mountCreate();

    await wrapper.find('input[type="text"]').setValue('Rental Agreement');
    await setFile(wrapper, pdf('Lease.pdf'));

    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Rental Agreement');
  });

  it('creates the template and reports it through templateCreated', async () => {
    const wrapper = mountCreate();

    await setFile(wrapper, pdf('Lease.pdf'));
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(mock.history.post.some(request => request.url === '/v2/templates')).toBe(true);
    const [ template ] = wrapper.emitted('templateCreated')![0] as [ITemplate];
    expect(template.id).toBe('t-new');
  });

  it('shows the size error and blocks submit for oversized files', async () => {
    const wrapper = mountCreate({ maxSize: 4 });

    await setFile(wrapper, pdf('Lease.pdf'));

    expect(wrapper.text()).toContain('Total file size must not exceed 20MB.');
    expect(buttonByText(wrapper, 'Create').attributes('disabled')).toBeDefined();
  });

  it('emits cancel when the user cancels', async () => {
    const wrapper = mountCreate();

    await buttonByText(wrapper, 'Cancel').trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(mock.history.post).toHaveLength(0);
  });
});
