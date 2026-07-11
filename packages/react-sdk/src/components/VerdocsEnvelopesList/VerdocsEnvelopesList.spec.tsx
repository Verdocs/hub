import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { getEnvelopes, userCanCancelEnvelope } from '@verdocs/js-sdk';
import type { IEnvelope, IListEnvelopesParams, IRecipient } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import VerdocsEnvelopesList from './VerdocsEnvelopesList';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getEnvelopes: vi.fn(),
    userCanCancelEnvelope: vi.fn(),
  };
});

const makeRecipient = (overrides: Partial<IRecipient>): IRecipient =>
  ({
    envelope_id: 'envelope-1',
    role_name: 'Signer 1',
    first_name: 'Paige',
    last_name: 'Turner',
    email: 'paige.turner@example.com',
    sequence: 1,
    status: 'invited',
    ...overrides,
  }) as IRecipient;

const makeEnvelope = (overrides: Partial<IEnvelope>): IEnvelope =>
  ({
    id: 'envelope-1',
    name: 'Test Envelope',
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    recipients: [makeRecipient({})],
    ...overrides,
  }) as IEnvelope;

const envelopes = [
  makeEnvelope({
    id: 'e-1',
    name: 'Offer Letter',
    recipients: [makeRecipient({}), makeRecipient({ role_name: 'Signer 2', first_name: 'Rita', last_name: 'Booke' })],
  }),
  makeEnvelope({ id: 'e-2', name: 'Lease Agreement', status: 'complete' }),
];

const lastQueryParams = (): IListEnvelopesParams => {
  const calls = vi.mocked(getEnvelopes).mock.calls;
  return calls[calls.length - 1]![1]!;
};

const renderList = (props = {}) =>
  render(
    <VerdocsProvider baseUrl="https://stage-api.verdocs.com">
      <VerdocsEnvelopesList {...props} />
    </VerdocsProvider>,
  );

describe('VerdocsEnvelopesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(userCanCancelEnvelope).mockReturnValue(true);
    vi.mocked(getEnvelopes).mockResolvedValue({ count: 2, rows: 2, page: 0, envelopes });
  });

  it('renders a row per envelope with its recipient summary', async () => {
    renderList();

    expect(await screen.findByText(/Offer Letter/)).toBeInTheDocument();
    expect(screen.getByText(/Lease Agreement/)).toBeInTheDocument();
    expect(screen.getByText('Paige Turner, Rita Booke')).toBeInTheDocument();

    // With no view selected, the default query mirrors the legacy list: the
    // full status set, plus paging and the default sort.
    expect(vi.mocked(getEnvelopes)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        page: 0,
        rows: 10,
        sort_by: 'created_at',
        status: ['pending', 'in progress', 'complete', 'declined', 'canceled'],
      }),
    );
    expect(lastQueryParams().view).toBeUndefined();
  });

  it('fires onViewEnvelope when a row is clicked', async () => {
    const onViewEnvelope = vi.fn();
    renderList({ onViewEnvelope });

    await userEvent.click(await screen.findByText(/Offer Letter/));

    expect(onViewEnvelope).toHaveBeenCalledWith(expect.objectContaining({ envelope: envelopes[0] }));
  });

  it('requeries with the completed view and its pinned status', async () => {
    const onChangeView = vi.fn();
    renderList({ onChangeView });

    await screen.findByText(/Offer Letter/);
    await userEvent.click(screen.getByRole('button', { name: /View:/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Completed' }));

    await waitFor(() => {
      expect(vi.mocked(getEnvelopes)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ view: 'completed', status: ['complete'] }),
      );
    });
    expect(lastQueryParams().sort_by).toBeUndefined();
    expect(onChangeView).toHaveBeenCalledWith('completed');
  });

  it('pins pending and in-progress statuses in the action view', async () => {
    renderList({ view: 'action' });

    await screen.findByText(/Offer Letter/);
    expect(vi.mocked(getEnvelopes)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ view: 'action', status: ['pending', 'in progress'] }),
    );
  });

  it('applies the status filter in the all view', async () => {
    renderList({ view: 'all' });

    await screen.findByText(/Offer Letter/);
    await userEvent.click(screen.getByRole('button', { name: /Status:/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Declined' }));

    await waitFor(() => {
      expect(vi.mocked(getEnvelopes)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: ['declined'] }),
      );
    });
    expect(lastQueryParams().view).toBeUndefined();
  });

  it('hides the status and sort filters outside the all view', async () => {
    renderList({ view: 'inbox' });

    await screen.findByText(/Offer Letter/);
    expect(screen.queryByRole('button', { name: /Status:/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sort By:/ })).not.toBeInTheDocument();
  });

  it('commits the match filter on blur as the q param', async () => {
    const onChangeMatch = vi.fn();
    renderList({ onChangeMatch });

    await screen.findByText(/Offer Letter/);
    await userEvent.type(screen.getByPlaceholderText('Filter by Name, Recipient, or Field...'), 'Offer ');

    // Still uncommitted: typing alone must not requery (the server does the
    // matching, so we wait for the blur).
    expect(lastQueryParams().q).toBeUndefined();

    await userEvent.tab();

    await waitFor(() => {
      expect(vi.mocked(getEnvelopes)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ q: 'Offer', page: 0 }),
      );
    });
    expect(onChangeMatch).toHaveBeenCalledWith('Offer');
  });

  it('requeries when a new page is selected', async () => {
    vi.mocked(getEnvelopes).mockResolvedValue({ count: 25, rows: 10, page: 0, envelopes });

    renderList();

    await screen.findByText(/Offer Letter/);
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    await waitFor(() => {
      expect(vi.mocked(getEnvelopes)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ page: 1 }));
    });
  });

  it('fires onDownload and onCancelEnvelope from the row menu', async () => {
    const onDownload = vi.fn();
    const onCancelEnvelope = vi.fn();
    renderList({ onDownload, onCancelEnvelope });

    await screen.findByText(/Offer Letter/);
    const menuButtons = screen.getAllByRole('button', { name: 'Open menu' });

    await userEvent.click(menuButtons[0]!);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Download' }));
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ envelope: envelopes[0] }));

    await userEvent.click(menuButtons[0]!);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cancel' }));
    expect(onCancelEnvelope).toHaveBeenCalledWith(expect.objectContaining({ envelope: envelopes[0] }));
  });

  it('disables Cancel when the user cannot cancel the envelope', async () => {
    vi.mocked(userCanCancelEnvelope).mockReturnValue(false);

    renderList();

    await screen.findByText(/Offer Letter/);
    await userEvent.click(screen.getAllByRole('button', { name: 'Open menu' })[0]!);

    expect(screen.getByRole('menuitem', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'View Envelope' })).toBeEnabled();
  });

  it('shows the empty state when no envelopes match', async () => {
    vi.mocked(getEnvelopes).mockResolvedValue({ count: 0, rows: 0, page: 0, envelopes: [] });

    renderList();

    expect(await screen.findByText(/No matching envelopes found/)).toBeInTheDocument();
  });
});
