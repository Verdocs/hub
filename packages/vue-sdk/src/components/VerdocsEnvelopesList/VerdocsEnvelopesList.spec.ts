import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { IEnvelope } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsEnvelopesList, { type IEnvelopeEvent } from './VerdocsEnvelopesList.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';
import { makeTestJwt } from '../../test/support';

const makeEnvelope = (overrides: Partial<IEnvelope>): IEnvelope =>
  ({
    id: 'envelope-1',
    name: 'Offer Letter',
    status: 'in progress',
    profile_id: 'profile-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    recipients: [ { role_name: 'Signer 1', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } ],
    ...overrides,
  }) as unknown as IEnvelope;

const page = (envelopes: IEnvelope[], count = envelopes.length) => ({ count, rows: 10, page: 0, envelopes });

describe('VerdocsEnvelopesList', () => {
  let mock: MockAdapter;
  let lastParams: Record<string, unknown> | undefined;

  beforeEach(() => {
    localStorage.clear();
    lastParams = undefined;

    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes').reply(config => {
      lastParams = config.params;
      return [ 200, page([ makeEnvelope({}), makeEnvelope({ id: 'envelope-2', name: 'NDA', status: 'complete' }) ]) ];
    });
    // The signed-in user owns the envelopes, which unlocks Cancel.
    mock.onGet('/v2/profiles').reply(200, [ { id: 'profile-1', current: true } ]);
  });

  afterEach(() => {
    mock.restore();
  });

  const mountList = async (props: Record<string, unknown> = {}) => {
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    endpoint.setToken(makeTestJwt({ profile_id: 'profile-1' }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsEnvelopesList, {
      props: { view: 'all', ...props },
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

  it('renders a row per envelope with name and recipients', async () => {
    const wrapper = await mountList();

    expect(wrapper.text()).toContain('Offer Letter');
    expect(wrapper.text()).toContain('NDA');
    expect(wrapper.text()).toContain('Paige Turner');
  });

  it('requests the default all-view status set, sort, and page', async () => {
    await mountList();

    expect(lastParams?.status).toEqual([ 'pending', 'in progress', 'complete', 'declined', 'canceled' ]);
    expect(lastParams?.sort_by).toBe('created_at');
    expect(lastParams?.page).toBe(0);
    expect(lastParams?.rows).toBe(10);
  });

  it('requeries with a single status when the status filter narrows', async () => {
    const wrapper = await mountList();

    await wrapper.findAll('button').find(button => button.text().startsWith('Status:'))!.trigger('click');
    await wrapper.findAll('[role="option"]').find(option => option.text() === 'Declined')!.trigger('click');
    await flushPromises();

    expect(lastParams?.status).toEqual([ 'declined' ]);
    expect(lastParams?.page).toBe(0);
  });

  it('requeries with the view param when the view changes', async () => {
    const wrapper = await mountList();

    await wrapper.findAll('button').find(button => button.text().startsWith('View:'))!.trigger('click');
    await wrapper.findAll('[role="option"]').find(option => option.text() === 'Inbox')!.trigger('click');
    await flushPromises();

    expect(lastParams?.view).toBe('inbox');
  });

  it('sends the match term as q after a filter commit', async () => {
    const wrapper = await mountList();

    await wrapper.get('input').setValue('  contract  ');
    await wrapper.get('input').trigger('blur');
    await flushPromises();

    expect(lastParams?.q).toBe('contract');
  });

  it('emits viewEnvelope when a row is clicked', async () => {
    const wrapper = await mountList();

    const row = wrapper.findAll('[class*="cursor-pointer"]').find(candidate => candidate.text().includes('Offer Letter'));
    await row!.trigger('click');

    const [ event ] = wrapper.emitted('viewEnvelope')![0] as [IEnvelopeEvent];
    expect(event.envelope.name).toBe('Offer Letter');
  });

  it('routes row-menu selections to the matching event', async () => {
    const wrapper = await mountList();

    await wrapper.findAll('button[aria-label="Open menu"]')[0]!.trigger('click');
    await wrapper.findAll('[role="menuitem"]').find(item => item.text() === 'Download')!.trigger('click');
    expect(wrapper.emitted('download')).toHaveLength(1);

    await wrapper.findAll('button[aria-label="Open menu"]')[0]!.trigger('click');
    await wrapper.findAll('[role="menuitem"]').find(item => item.text() === 'Cancel')!.trigger('click');
    expect(wrapper.emitted('cancelEnvelope')).toHaveLength(1);
  });

  it('shows the empty state when no envelopes match', async () => {
    mock.onGet('/v2/envelopes').reply(200, page([]));

    const wrapper = await mountList();

    expect(wrapper.text()).toContain('No matching envelopes found');
  });
});
