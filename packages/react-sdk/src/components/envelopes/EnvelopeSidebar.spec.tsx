import { VerdocsEndpoint } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { IEnvelope, IEnvelopeHistory, IProfile, IRecipient, TSession } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import EnvelopeSidebar from './EnvelopeSidebar';

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

const ownerProfile = {
  id: 'profile-1',
  email: 'owner@example.com',
  first_name: 'Olive',
  last_name: 'Owner',
} as IProfile;

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

const makeHistory = (overrides: Partial<IEnvelopeHistory>): IEnvelopeHistory =>
  ({
    id: 'history-1',
    envelope_id: 'env-1',
    role_name: 'Recipient 1',
    event: 'recipient:invited',
    event_detail: 'mail',
    created_at: '2026-07-01T00:01:00Z',
    ...overrides,
  }) as IEnvelopeHistory;

const makeEnvelope = (overrides: Partial<IEnvelope> = {}): IEnvelope =>
  ({
    id: 'env-1',
    status: 'pending',
    profile_id: 'profile-1',
    name: 'Test Envelope',
    initial_reminder: null,
    followup_reminders: null,
    next_reminder: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-02T00:00:00Z',
    profile: ownerProfile,
    recipients: [
      makeRecipient(),
      makeRecipient({ role_name: 'Recipient 2', first_name: 'Sam', last_name: 'Signer', email: 'sam@example.com', status: 'pending', sequence: 2 }),
    ],
    history_entries: [
      makeHistory({}),
      makeHistory({ id: 'history-2', event: 'recipient:signed', event_detail: '', created_at: '2026-07-01T09:00:00Z' }),
    ],
    ...overrides,
  }) as IEnvelope;

describe('EnvelopeSidebar', () => {
  let endpoint: VerdocsEndpoint;
  let calls: IFakeCall[];

  beforeEach(() => {
    localStorage.clear();
    endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com', persist: false });

    // The sidebar's owner-only affordances key off the endpoint's profile.
    endpoint.session = { profile_id: 'profile-1' } as unknown as TSession;
    endpoint.profile = ownerProfile;

    calls = installFakeApi(endpoint, (method, url) => {
      if (method === 'patch' && url.includes('/recipients/')) {
        return { status: 'OK' };
      }
      if (method === 'put') {
        return makeEnvelope({ status: 'canceled' });
      }
      if (method === 'patch') {
        return makeEnvelope();
      }

      return makeEnvelope();
    });
  });

  const renderSidebar = (props = {}) =>
    render(
      <VerdocsProvider endpoint={endpoint}>
        <EnvelopeSidebar envelopeId="env-1" {...props} />
      </VerdocsProvider>,
    );

  it('opens the Details tab and reports the toggle', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderSidebar({ onToggle });

    await user.click(screen.getByRole('tab', { name: 'Details' }));

    expect(onToggle).toHaveBeenCalledWith(true);
    expect(await screen.findByText('env-1')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();

    // Clicking the active tab again collapses the panel.
    await user.click(screen.getByRole('tab', { name: 'Details' }));
    expect(onToggle).toHaveBeenLastCalledWith(false);
  });

  it('renders recipients with statuses and sends reminders from the row menu', async () => {
    const user = userEvent.setup();
    const onEnvelopeUpdated = vi.fn();
    renderSidebar({ onEnvelopeUpdated });

    await user.click(screen.getByRole('tab', { name: 'Recipients' }));

    expect(await screen.findByText('Rita Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Sam Signer')).toBeInTheDocument();
    expect(screen.getByText('invited')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();

    const menus = screen.getAllByRole('button', { name: 'Open menu' });
    await user.click(menus[0]!);
    await user.click(screen.getByRole('menuitem', { name: 'Send Reminder' }));

    await waitFor(() => {
      expect(onEnvelopeUpdated).toHaveBeenCalledWith(expect.objectContaining({ event: 'reminder' }));
    });

    const patch = calls.find(call => call.method === 'patch');
    expect(patch).toEqual({
      method: 'patch',
      url: '/v2/envelopes/env-1/recipients/Recipient%201',
      body: { action: 'remind' },
    });
  });

  it('hands the in-person link action to the host', async () => {
    const user = userEvent.setup();
    const onGetInPersonLink = vi.fn();
    renderSidebar({ onGetInPersonLink });

    await user.click(screen.getByRole('tab', { name: 'Recipients' }));
    await screen.findByText('Rita Reviewer');

    const menus = screen.getAllByRole('button', { name: 'Open menu' });
    await user.click(menus[0]!);
    await user.click(screen.getByRole('menuitem', { name: 'Get In-Person Link' }));

    expect(onGetInPersonLink).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: expect.objectContaining({ role_name: 'Recipient 1' }) }),
    );
  });

  it('renders the history timeline', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('tab', { name: 'History' }));

    expect(await screen.findByText('Rita Reviewer has been invited via email.')).toBeInTheDocument();
    expect(screen.getByText('Signed by Rita Reviewer.')).toBeInTheDocument();
    expect(screen.getByText('Envelope created.')).toBeInTheDocument();
  });

  it('cancels the envelope after confirmation', async () => {
    const user = userEvent.setup();
    const onEnvelopeUpdated = vi.fn();
    renderSidebar({ onEnvelopeUpdated });

    await user.click(screen.getByRole('tab', { name: 'Recipients' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel Envelope' }));
    await user.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(onEnvelopeUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'canceled', envelope: expect.objectContaining({ status: 'canceled' }) }),
      );
    });

    const put = calls.find(call => call.method === 'put');
    expect(put).toEqual({ method: 'put', url: '/v2/envelopes/env-1', body: { action: 'cancel' } });
  });
});
