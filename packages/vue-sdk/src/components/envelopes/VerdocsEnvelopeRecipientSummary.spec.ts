import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { IEnvelope } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsEnvelopeRecipientSummary from './VerdocsEnvelopeRecipientSummary.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';

const envelope = {
  id: 'env-1',
  name: 'Offer Letter',
  status: 'in progress',
  recipients: [ { role_name: 'Signer 1', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com', sequence: 1, order: 0, status: 'invited' } ],
} as unknown as IEnvelope;

const findButton = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find(button => button.text() === label);

describe('VerdocsEnvelopeRecipientSummary', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });

    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes/env-1').reply(200, envelope);
    mock.onPost(/\/v2\/sign\/in-person\/env-1\//).reply(200, { link: 'https://verdocs.com/sign/in-person/abc' });
  });

  afterEach(() => {
    mock.restore();
  });

  const mountSummary = async () => {
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsEnvelopeRecipientSummary, {
      props: { envelopeId: 'env-1' },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders each recipient with role and status', async () => {
    const wrapper = await mountSummary();

    expect(wrapper.text()).toContain('Recipient Summary');
    expect(wrapper.text()).toContain('Signer 1');
    expect(wrapper.text()).toContain('Paige Turner');
    expect(wrapper.text()).toContain('invited');
  });

  it('fetches and displays the in-person link when Get Link is clicked', async () => {
    const wrapper = await mountSummary();

    await findButton(wrapper, 'Get Link')!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('https://verdocs.com/sign/in-person/abc');
    expect(findButton(wrapper, 'Copy')).toBeTruthy();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://verdocs.com/sign/in-person/abc');
  });

  it('emits done with the envelope when Done is clicked', async () => {
    const wrapper = await mountSummary();

    await findButton(wrapper, 'Done')!.trigger('click');

    const [ event ] = wrapper.emitted('done')![0] as [{ envelope: IEnvelope }];
    expect(event.envelope.id).toBe('env-1');
  });

  it('shows an error panel when the envelope fails to load', async () => {
    mock.onGet('/v2/envelopes/env-1').reply(500);

    const wrapper = await mountSummary();

    expect(wrapper.text()).toContain('Unable to load envelope');
  });
});
