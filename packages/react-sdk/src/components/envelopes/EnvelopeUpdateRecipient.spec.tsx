import { VerdocsEndpoint } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import EnvelopeUpdateRecipient from './EnvelopeUpdateRecipient';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';

interface IFakeCall {
  method: string;
  url: string;
  body?: unknown;
}

// axios-mock-adapter is not installed in this package, so we fake the HTTP
// layer the same way it does: by replacing the axios adapter on the endpoint's
// api instance. Requests are recorded so specs can assert exact shapes.
const installFakeApi = (endpoint: VerdocsEndpoint, respond: (method: string, url: string) => unknown) => {
  const calls: IFakeCall[] = [];
  endpoint.api.defaults.adapter = async config => {
    const method = (config.method ?? 'get').toLowerCase();
    const url = config.url ?? '';
    calls.push({ method, url, body: typeof config.data === 'string' ? JSON.parse(config.data) : undefined });
    return { data: respond(method, url), status: 200, statusText: 'OK', headers: config.headers, config };
  };
  return calls;
};

const makeRecipient = (overrides: Partial<IRecipient> = {}): IRecipient =>
  ({
    envelope_id: 'env-1',
    role_name: 'Recipient 1',
    status: 'invited',
    first_name: 'Rita',
    last_name: 'Reviewer',
    email: 'rita@example.com',
    phone: null,
    message: null,
    sequence: 1,
    order: 1,
    type: 'signer',
    ...overrides,
  }) as IRecipient;

const makeEnvelope = (overrides: Partial<IEnvelope> = {}): IEnvelope =>
  ({
    id: 'env-1',
    status: 'pending',
    profile_id: 'profile-1',
    name: 'Test Envelope',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-02T00:00:00Z',
    recipients: [makeRecipient()],
    ...overrides,
  }) as IEnvelope;

describe('EnvelopeUpdateRecipient', () => {
  let endpoint: VerdocsEndpoint;
  let calls: IFakeCall[];

  beforeEach(() => {
    localStorage.clear();
    endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    calls = installFakeApi(endpoint, method => {
      if (method === 'patch') {
        return makeRecipient({ first_name: 'Margaret' });
      }

      return makeEnvelope();
    });
  });

  const renderDialog = (props = {}) =>
    render(
      <VerdocsProvider endpoint={endpoint}>
        <EnvelopeUpdateRecipient envelopeId="env-1" roleName="Recipient 1" {...props} />
      </VerdocsProvider>,
    );

  it('prefills the form from the loaded recipient', async () => {
    renderDialog();

    expect(await screen.findByDisplayValue('Rita')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Reviewer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('rita@example.com')).toBeInTheDocument();
    expect(screen.getByText('Recipient 1')).toBeInTheDocument();
  });

  it('submits only the changed fields and fires onUpdated', async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    renderDialog({ onUpdated });

    const firstName = await screen.findByLabelText('First Name');
    await user.clear(firstName);
    await user.type(firstName, 'Margaret');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Margaret' }));
    });

    const patch = calls.find(call => call.method === 'patch');
    expect(patch).toEqual({
      method: 'patch',
      url: '/v2/envelopes/env-1/recipients/Recipient%201',
      body: { first_name: 'Margaret' },
    });
  });

  it('fires onCancel without a request when nothing changed', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    await user.click(await screen.findByRole('button', { name: 'Save' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(calls.some(call => call.method === 'patch')).toBe(false);
  });

  it('fires onCancel from the Cancel button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(calls.some(call => call.method === 'patch')).toBe(false);
  });
});
