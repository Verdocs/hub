import { VerdocsEndpoint } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import EnvelopeRecipientSummary from './EnvelopeRecipientSummary';
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
    sequence: 1,
    order: 1,
    type: 'signer',
    ...overrides,
  }) as IRecipient;

const makeEnvelope = (overrides: Partial<IEnvelope> = {}): IEnvelope =>
  ({
    id: 'env-1',
    status: 'in progress',
    profile_id: 'profile-1',
    name: 'Test Envelope',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-02T00:00:00Z',
    recipients: [
      makeRecipient(),
      makeRecipient({ role_name: 'Recipient 2', first_name: 'Sam', last_name: 'Signer', email: 'sam@example.com', status: 'pending', sequence: 2 }),
    ],
    ...overrides,
  }) as IEnvelope;

describe('EnvelopeRecipientSummary', () => {
  let endpoint: VerdocsEndpoint;
  let calls: IFakeCall[];

  beforeEach(() => {
    localStorage.clear();
    endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
    calls = installFakeApi(endpoint, method => {
      if (method === 'post') {
        return { link: 'https://verdocs.com/sign/abc123' };
      }

      return makeEnvelope();
    });
  });

  const renderSummary = (props = {}) =>
    render(
      <VerdocsProvider endpoint={endpoint}>
        <EnvelopeRecipientSummary envelopeId="env-1" {...props} />
      </VerdocsProvider>,
    );

  it('renders each recipient with its status', async () => {
    renderSummary();

    expect(await screen.findByText('Recipient 1')).toBeInTheDocument();
    expect(screen.getByText('Recipient 2')).toBeInTheDocument();
    expect(screen.getByText('Rita Reviewer (rita@example.com)')).toBeInTheDocument();
    expect(screen.getByText('Sam Signer (sam@example.com)')).toBeInTheDocument();
    expect(screen.getByText('invited')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('fetches and displays an in-person link for the active recipient', async () => {
    const user = userEvent.setup();
    renderSummary();

    // Only Recipient 1 is at the active sequence, so there is exactly one Get Link button.
    const getLink = await screen.findByRole('button', { name: 'Get Link' });
    await user.click(getLink);

    expect(await screen.findByText('https://verdocs.com/sign/abc123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();

    const post = calls.find(call => call.method === 'post');
    expect(post?.url).toBe('/v2/sign/in-person/env-1/Recipient%201');
  });

  it('fires the workflow callbacks with the envelope', async () => {
    const user = userEvent.setup();
    const onAnother = vi.fn();
    const onView = vi.fn();
    const onDone = vi.fn();
    renderSummary({ onAnother, onView, onDone });

    await user.click(await screen.findByRole('button', { name: 'Send Another' }));
    await user.click(screen.getByRole('button', { name: 'View Now' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(onAnother).toHaveBeenCalledWith(expect.objectContaining({ envelope: expect.objectContaining({ id: 'env-1' }) }));
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ envelope: expect.objectContaining({ id: 'env-1' }) }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ envelope: expect.objectContaining({ id: 'env-1' }) }));
  });

  it('hides workflow buttons that are disabled by props', async () => {
    renderSummary({ canSendAnother: false, canView: false });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Send Another' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View Now' })).not.toBeInTheDocument();
  });
});
