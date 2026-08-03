import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { IEnvelope } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsEnvelopeSidebar from './VerdocsEnvelopeSidebar.vue';
import { makeTestJwt, TEST_API_BASE } from '../../test/support';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';

const makeEnvelope = (overrides: Partial<IEnvelope> = {}): IEnvelope =>
  ({
    id: 'env-1',
    name: 'Offer Letter',
    status: 'in progress',
    profile_id: 'profile-1',
    profile: { id: 'profile-1', email: 'owner@example.com', first_name: 'Olive', last_name: 'Owner' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    initial_reminder: null,
    followup_reminders: null,
    next_reminder: null,
    history_entries: [],
    recipients: [ { role_name: 'Signer 1', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com', sequence: 1, order: 0, status: 'invited' } ],
    ...overrides,
  }) as unknown as IEnvelope;

const body = () => new DOMWrapper(document.body);

describe('VerdocsEnvelopeSidebar', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes/env-1').reply(200, makeEnvelope());
    mock.onGet('/v2/profiles').reply(200, [ { id: 'profile-1', current: true } ]);
    mock.onPatch(/\/v2\/envelopes\/env-1\/recipients\//).reply(200, { status: 'OK' });
    mock.onPut('/v2/envelopes/env-1').reply(200, { ...makeEnvelope(), status: 'canceled' });
  });

  afterEach(() => {
    mock.restore();
  });

  const mountSidebar = async () => {
    const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    endpoint.setToken(makeTestJwt({ profile_id: 'profile-1' }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsEnvelopeSidebar, {
      props: { envelopeId: 'env-1' },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('starts collapsed and opens a tab on click, emitting toggle', async () => {
    const wrapper = await mountSidebar();

    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="Details"]').trigger('click');

    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true);
    expect(wrapper.emitted('toggle')![0]).toEqual([ true ]);
  });

  it('shows envelope metadata on the Details tab', async () => {
    const wrapper = await mountSidebar();

    await wrapper.get('button[aria-label="Details"]').trigger('click');

    expect(wrapper.text()).toContain('env-1');
    expect(wrapper.text()).toContain('owner@example.com');
  });

  it('lists recipients and offers owner controls', async () => {
    const wrapper = await mountSidebar();

    await wrapper.get('button[aria-label="Recipients"]').trigger('click');

    expect(wrapper.text()).toContain('Signer 1');
    expect(wrapper.text()).toContain('paige@example.com');
    expect(wrapper.find('button[aria-label="Open menu"]').exists()).toBe(true);
    expect(wrapper.findAll('button').some(button => button.text() === 'Cancel Envelope')).toBe(true);
  });

  it('sends a reminder and reports the update', async () => {
    const wrapper = await mountSidebar();

    await wrapper.get('button[aria-label="Recipients"]').trigger('click');
    await wrapper.get('button[aria-label="Open menu"]').trigger('click');
    await wrapper.findAll('[role="menuitem"]').find(item => item.text() === 'Send Reminder')!.trigger('click');
    await flushPromises();

    const reminderPatch = mock.history.patch.find(request => JSON.parse(request.data ?? '{}').action === 'remind');
    expect(reminderPatch).toBeTruthy();
    expect(wrapper.emitted('envelopeUpdated')!.at(-1)![0]).toMatchObject({ event: 'reminder' });
  });

  it('cancels the envelope after the confirmation dialog', async () => {
    const wrapper = await mountSidebar();

    await wrapper.get('button[aria-label="Recipients"]').trigger('click');
    await wrapper.findAll('button').find(button => button.text() === 'Cancel Envelope')!.trigger('click');

    await body().findAll('button').find(button => button.text() === 'OK')!.trigger('click');
    await flushPromises();

    expect(mock.history.put).toHaveLength(1);
    expect(wrapper.emitted('envelopeUpdated')!.at(-1)![0]).toMatchObject({ event: 'canceled' });

    wrapper.unmount();
  });

  it('lists activity entries on the History tab', async () => {
    const wrapper = await mountSidebar();

    await wrapper.get('button[aria-label="History"]').trigger('click');

    expect(wrapper.text()).toContain('Envelope created.');
  });
});
