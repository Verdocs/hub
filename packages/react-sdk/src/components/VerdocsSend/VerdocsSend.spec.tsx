import axios from 'axios';
import type { ComponentProps } from 'react';
import MockAdapter from 'axios-mock-adapter';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { IBrand, IEnvelope, IOrganization, IRole, ITemplate } from '@verdocs/js-sdk';
import { VerdocsEndpoint, createEnvelope, getActiveEntitlements, getBrands, getOrganization, getOrganizationContacts, getTemplate } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { makeTestJwt } from '../../test/setup';
import VerdocsSend from './VerdocsSend';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getTemplate: vi.fn(),
    getBrands: vi.fn(),
    getOrganization: vi.fn(),
    getOrganizationContacts: vi.fn(),
    getActiveEntitlements: vi.fn(),
    createEnvelope: vi.fn(),
  };
});

const makeRole = (overrides: Partial<IRole>): IRole =>
  ({
    template_id: 'template-1',
    name: 'Signer 1',
    type: 'signer',
    sequence: 1,
    order: 1,
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    message: null,
    ...overrides,
  }) as IRole;

const makeTemplate = (overrides: Partial<ITemplate>): ITemplate =>
  ({
    id: 'template-1',
    name: 'Offer Letter',
    organization_id: 'org-1',
    is_sendable: true,
    roles: [makeRole({})],
    ...overrides,
  }) as ITemplate;

const filledRole = (overrides: Partial<IRole>) =>
  makeRole({ first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com', ...overrides });

const makeBrand = (overrides: Partial<IBrand>): IBrand =>
  ({
    id: 'brand-1',
    organization_id: 'org-1',
    key: 'acme',
    name: 'Acme Corp',
    favicon_url: null,
    thumbnail_url: null,
    primary_color: '#123456',
    ...overrides,
  }) as IBrand;

let mock: MockAdapter;

const renderSend = (props: Partial<ComponentProps<typeof VerdocsSend>> = {}) => {
  // The endpoint is built after the adapter is installed so its axios instance inherits the
  // mocked transport, and the token gives the component the session it insists on.
  const endpoint = new VerdocsEndpoint({ persist: false });
  endpoint.setToken(makeTestJwt());

  return render(
    <VerdocsProvider endpoint={endpoint}>
      <VerdocsSend templateId="template-1" {...props} />
    </VerdocsProvider>,
  );
};

const lastRequest = () => vi.mocked(createEnvelope).mock.calls[vi.mocked(createEnvelope).mock.calls.length - 1]![1] as any;

describe('VerdocsSend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mock = new MockAdapter(axios);
    mock.onAny().reply(200, {});

    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({}));
    vi.mocked(getBrands).mockResolvedValue([]);
    vi.mocked(getOrganization).mockResolvedValue({ id: 'org-1', name: 'Test Org' } as IOrganization);
    vi.mocked(getOrganizationContacts).mockResolvedValue([]);
    vi.mocked(getActiveEntitlements).mockResolvedValue({});
    vi.mocked(createEnvelope).mockResolvedValue({ id: 'envelope-1' } as IEnvelope);
  });

  afterEach(() => {
    mock.restore();
  });

  it('renders a row per role, with step labels only when the template has more than one step', async () => {
    vi.mocked(getTemplate).mockResolvedValue(
      makeTemplate({ roles: [makeRole({ name: 'Buyer' }), makeRole({ name: 'Seller', sequence: 2 })] }),
    );

    renderSend();

    expect(await screen.findByText('Buyer')).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getAllByText('Configure recipient')).toHaveLength(2);
  });

  it('omits step labels for a single-step template', async () => {
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ roles: [makeRole({ name: 'Buyer' }), makeRole({ name: 'Seller' })] }));

    renderSend();

    expect(await screen.findByText('Buyer')).toBeInTheDocument();
    expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
  });

  it('keeps Send disabled until every role is configured', async () => {
    vi.mocked(getTemplate).mockResolvedValue(
      makeTemplate({ roles: [filledRole({ name: 'Buyer' }), makeRole({ name: 'Seller' })] }),
    );

    renderSend();

    expect(await screen.findByText('Buyer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByText('Paige Turner \u00b7 paige@example.com')).toBeInTheDocument();
    expect(screen.getByText('Configure recipient')).toBeInTheDocument();
  });

  it('enables Send once every role carries a name and email', async () => {
    vi.mocked(getTemplate).mockResolvedValue(
      makeTemplate({
        roles: [filledRole({ name: 'Buyer' }), filledRole({ name: 'Seller', email: 'rita@example.com', first_name: 'Rita', last_name: 'Booke' })],
      }),
    );

    renderSend();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    expect(screen.queryByText('Recipients cannot share the same email.')).not.toBeInTheDocument();
  });

  it('merges a contact picked in the detail view into its role', async () => {
    const user = userEvent.setup();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ roles: [makeRole({ name: 'Buyer' })] }));

    renderSend();

    await user.click(await screen.findByRole('button', { name: /Buyer/ }));
    await user.type(screen.getByLabelText('First name'), 'Paige');
    await user.type(screen.getByLabelText('Last name'), 'Turner');
    await user.type(screen.getByLabelText('Email'), 'paige@example.com');
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.getByText('Paige Turner \u00b7 paige@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('blocks the send when two recipients share an email', async () => {
    vi.mocked(getTemplate).mockResolvedValue(
      makeTemplate({ roles: [filledRole({ name: 'Buyer' }), filledRole({ name: 'Seller' })] }),
    );

    renderSend();

    expect(await screen.findByText('Recipients cannot share the same email.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('labels the brand row with the organization default when there is one', async () => {
    vi.mocked(getBrands).mockResolvedValue([makeBrand({})]);
    vi.mocked(getOrganization).mockResolvedValue({ id: 'org-1', default_brand_id: 'brand-1' } as IOrganization);

    renderSend();

    expect(await screen.findByText('Default (Acme Corp)')).toBeInTheDocument();
  });

  it('falls back to Verdocs styling in the brand row when the organization has no default', async () => {
    renderSend();

    expect(await screen.findByText('Default (Verdocs)')).toBeInTheDocument();
  });

  it('clamps the expiration to 120 days and treats a blank field as the default', async () => {
    const user = userEvent.setup();
    renderSend();

    expect(await screen.findByText('Signer 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Expires/ }));

    const field = screen.getByLabelText('Expires in days');
    await user.type(field, '999');
    expect(field).toHaveValue('120');

    await user.clear(field);
    await user.type(field, '30');
    expect(field).toHaveValue('30');

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: /Expires 30 days/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Expires/ }));
    await user.clear(screen.getByLabelText('Expires in days'));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: /Expires 120 days/ })).toBeInTheDocument();
  });

  it('switches the notifications row to Off when they are disabled', async () => {
    const user = userEvent.setup();
    renderSend();

    expect(await screen.findByText('Signer 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notifications On/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Disable notifications' }));

    expect(screen.getByText(/Disabling notifications turns off invitations/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: /Notifications Off/ })).toBeInTheDocument();
  });

  it('posts the envelope request and reports the result', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ roles: [filledRole({ name: 'Buyer' })] }));

    renderSend({ environment: 'web', onSend });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(vi.mocked(createEnvelope)).toHaveBeenCalled());

    const request = lastRequest();
    expect(request).toMatchObject({
      template_id: 'template-1',
      name: 'Offer Letter',
      environment: 'web',
      initial_reminder: 0,
      followup_reminders: 0,
      no_contact: false,
    });
    expect(request.brand_key).toBeUndefined();
    expect(typeof request.expires_at).toBe('string');
    expect(request.recipients).toMatchObject([{ role_name: 'Buyer', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' }]);

    await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ envelope_id: 'envelope-1' })));
  });

  it('cancels the send when onBeforeSend returns false', async () => {
    const user = userEvent.setup();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ roles: [filledRole({ name: 'Buyer' })] }));

    renderSend({ onBeforeSend: () => false });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(vi.mocked(createEnvelope)).not.toHaveBeenCalled();
  });

  it('renders nothing for a template that is not sendable', async () => {
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ is_sendable: false }));

    const { container } = renderSend();

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
