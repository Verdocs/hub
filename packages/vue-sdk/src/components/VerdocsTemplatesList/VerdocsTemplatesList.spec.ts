import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ITemplate } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsTemplatesList from './VerdocsTemplatesList.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import type { ITemplateEvent } from '../../types';

const makeTemplate = (overrides: Partial<ITemplate>): ITemplate =>
  ({
    id: 'template-1',
    name: 'Test Template',
    counter: 3,
    star_counter: 0,
    is_personal: false,
    is_public: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    last_used_at: '2026-03-01T00:00:00Z',
    ...overrides,
  }) as ITemplate;

const templates = [
  makeTemplate({ id: 't-1', name: 'Onboarding Packet', star_counter: 1 }),
  makeTemplate({ id: 't-2', name: 'Sales Agreement' }),
];

describe('VerdocsTemplatesList', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/templates').reply(200, { count: 2, rows: 2, page: 0, templates });
  });

  afterEach(() => {
    mock.restore();
  });

  const mountList = async (props = {}) => {
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsTemplatesList, {
      props,
      global: {
        provide: {
          [VERDOCS_ENDPOINT_KEY as symbol]: endpoint,
          [VUE_QUERY_CLIENT]: queryClient,
        },
      },
    });

    await flushPromises();
    return wrapper;
  };

  it('renders a row per template', async () => {
    const wrapper = await mountList();

    expect(wrapper.text()).toContain('Onboarding Packet');
    expect(wrapper.text()).toContain('Sales Agreement');

    const listRequest = mock.history.get.find(request => request.url === '/v2/templates');
    expect(listRequest?.params).toEqual(
      expect.objectContaining({ visibility: 'private_shared', sort_by: 'updated_at', page: 0, rows: 10 }),
    );
  });

  it('fires viewTemplate when a row is clicked', async () => {
    const wrapper = await mountList();

    const row = wrapper.findAll('[class*="cursor-pointer"]').find(candidate => candidate.text().includes('Onboarding Packet'));
    await row!.trigger('click');

    const [ event ] = wrapper.emitted('viewTemplate')![0] as [ITemplateEvent];
    expect(event.template.id).toBe('t-1');
  });

  it('filters locally while typing', async () => {
    const wrapper = await mountList();

    await wrapper.get('input[placeholder="Filter by Name..."]').setValue('Sales');

    expect(wrapper.text()).not.toContain('Onboarding Packet');
    expect(wrapper.text()).toContain('Sales Agreement');
  });

  it('requeries with is_starred when the starred filter changes', async () => {
    const wrapper = await mountList();

    await wrapper.findAll('button').find(button => button.text().startsWith('Starred:'))!.trigger('click');
    await wrapper.findAll('[role="option"]').find(option => option.text() === 'Starred')!.trigger('click');
    await flushPromises();

    const starredRequest = mock.history.get.filter(request => request.url === '/v2/templates').at(-1);
    expect(starredRequest?.params).toEqual(expect.objectContaining({ is_starred: true }));
  });

  it('offers Sign Now as a disabled menu item and omits Delete', async () => {
    const wrapper = await mountList();

    await wrapper.findAll('button[aria-label="Open menu"]')[0]!.trigger('click');

    const items = wrapper.findAll('[role="menuitem"]');
    const labels = items.map(item => item.text());
    expect(labels).toContain('Sign Now');
    expect(labels).not.toContain('Delete');

    const signNow = items.find(item => item.text() === 'Sign Now');
    expect(signNow!.attributes('disabled')).toBeDefined();
  });

  it('shows the empty state when no templates match', async () => {
    mock.onGet('/v2/templates').reply(200, { count: 0, rows: 0, page: 0, templates: [] });

    const wrapper = await mountList();

    expect(wrapper.text()).toContain('No matching templates found');
  });
});
