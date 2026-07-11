import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { IEnvelope } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { DOMWrapper, flushPromises, mount } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import VerdocsEnvelopeUpdateRecipient from './VerdocsEnvelopeUpdateRecipient.vue';
import { VERDOCS_ENDPOINT_KEY } from '../../provider/keys';

const envelope = {
  id: 'env-1',
  name: 'Offer Letter',
  status: 'in progress',
  recipients: [ { role_name: 'Signer 1', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } ],
} as unknown as IEnvelope;

const body = () => new DOMWrapper(document.body);
const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label);

describe('VerdocsEnvelopeUpdateRecipient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes/env-1').reply(200, envelope);
    mock.onPatch(/\/v2\/envelopes\/env-1\/recipients\//).reply(config => [ 200, { role_name: 'Signer 1', ...JSON.parse(config.data) } ]);
  });

  afterEach(() => {
    mock.restore();
  });

  const mountDialog = async () => {
    const endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(VerdocsEnvelopeUpdateRecipient, {
      props: { envelopeId: 'env-1', roleName: 'Signer 1' },
      global: { provide: { [VERDOCS_ENDPOINT_KEY as symbol]: endpoint, [VUE_QUERY_CLIENT]: queryClient } },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders the dialog with the recipient prefilled', async () => {
    const wrapper = await mountDialog();

    expect(body().get('[role="dialog"]').text()).toContain('Signer 1');
    expect(body().get<HTMLInputElement>('input[aria-label="First Name"]').element.value).toBe('Paige');
    expect(body().get<HTMLInputElement>('input[aria-label="Email Address"]').element.value).toBe('paige@example.com');

    wrapper.unmount();
  });

  it('treats a no-op save as a cancel and sends no request', async () => {
    const wrapper = await mountDialog();

    await buttonByLabel('Save')!.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(mock.history.patch).toHaveLength(0);

    wrapper.unmount();
  });

  it('patches only the changed fields and emits updated', async () => {
    const wrapper = await mountDialog();

    await body().get('input[aria-label="First Name"]').setValue('Payton');
    await buttonByLabel('Save')!.trigger('click');
    await flushPromises();

    expect(mock.history.patch).toHaveLength(1);
    expect(JSON.parse(mock.history.patch[0]!.data)).toEqual({ first_name: 'Payton' });
    expect(wrapper.emitted('updated')).toHaveLength(1);

    wrapper.unmount();
  });

  it('emits cancel when dismissed via the close button', async () => {
    const wrapper = await mountDialog();

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
