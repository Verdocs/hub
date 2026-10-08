import axios from 'axios';
import { page } from 'vitest/browser';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IBrand, IEnvelope, IOrganization, IRole, ITemplate } from '@verdocs/js-sdk';
import { invalidateOrganizationQueries } from '../store/organizations.js';
import type { ISendEventDetail, ISentEventDetail } from './vdocs-send.js';
import { invalidateTemplateDetail } from '../store/template-detail.js';
import { makeTestJwt, mount, TEST_API_BASE } from '../test/helpers.js';
import './vdocs-send.js';

const TEMPLATE_ID = 'template-1';
const ORGANIZATION_ID = 'org-1';

const makeRole = (overrides: Partial<IRole> = {}): IRole =>
  ({
    template_id: TEMPLATE_ID,
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

const filledRole = (overrides: Partial<IRole> = {}) => makeRole({ first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com', ...overrides });

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: TEMPLATE_ID,
    name: 'Offer Letter',
    organization_id: ORGANIZATION_ID,
    is_sendable: true,
    roles: [ makeRole() ],
    ...overrides,
  }) as ITemplate;

const makeBrand = (overrides: Partial<IBrand> = {}): IBrand =>
  ({
    id: 'brand-1',
    organization_id: ORGANIZATION_ID,
    key: 'acme',
    name: 'Acme Corp',
    favicon_url: null,
    thumbnail_url: null,
    primary_color: '#123456',
    ...overrides,
  }) as IBrand;

describe('vdocs-send', () => {
  let mock: MockAdapter;
  let endpoint: VerdocsEndpoint;
  let template: ITemplate;
  let brands: IBrand[];
  let organization: IOrganization;

  beforeEach(async () => {
    localStorage.clear();
    // The stores are module-level, so each test has to start from an empty cache.
    invalidateOrganizationQueries();
    await invalidateTemplateDetail(TEMPLATE_ID);

    template = makeTemplate();
    brands = [];
    organization = { id: ORGANIZATION_ID, name: 'Test Org' } as IOrganization;

    // Under NodeNext resolution the spec sees axios's ESM types and the adapter's CJS types see the CJS
    // ones, and the Axios class has private members, so the two AxiosInstance declarations do not unify.
    mock = new MockAdapter(axios as unknown as ConstructorParameters<typeof MockAdapter>[0]);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(() => [ 200, template ]);
    mock.onGet(`/v2/organizations/${ORGANIZATION_ID}/brands`).reply(() => [ 200, brands ]);
    mock.onGet('/v2/organizations/entitlements').reply(200, []);
    mock.onGet(`/v2/organizations/${ORGANIZATION_ID}`).reply(() => [ 200, organization ]);
    mock.onGet('/v2/organization-contacts').reply(200, []);
    mock.onPost('/v2/envelopes').reply(200, { id: 'envelope-1' } as IEnvelope);

    endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE });
    endpoint.setDefault();
    endpoint.setToken(makeTestJwt());
  });

  afterEach(() => {
    mock.restore();
    document.body.replaceChildren();
  });

  const mountSend = async (configure?: (el: HTMLElementTagNameMap['vdocs-send']) => void) => {
    const el = document.createElement('vdocs-send');
    el.templateId = TEMPLATE_ID;
    configure?.(el);
    await mount(el);
    return el;
  };

  const buttonNamed = (el: HTMLElement, name: string) => Array.from(el.querySelectorAll('button')).find(button => button.textContent?.trim() === name);

  const rowNamed = (el: HTMLElement, label: string) => Array.from(el.querySelectorAll('button')).find(button => button.textContent?.includes(label));

  const sentRequests = () => mock.history.post.filter(request => request.url === '/v2/envelopes').map(request => JSON.parse(String(request.data)));

  it('renders a row per role, with step labels only when the template has more than one step', async () => {
    template = makeTemplate({ roles: [ makeRole({ name: 'Buyer' }), makeRole({ name: 'Seller', sequence: 2 }) ] });
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Buyer'));
    expect(el.textContent).toContain('Seller');
    expect(el.textContent).toContain('Step 1');
    expect(el.textContent).toContain('Step 2');
    expect(el.querySelectorAll('[data-rn]')).toHaveLength(2);
  });

  it('omits step labels for a single-step template', async () => {
    template = makeTemplate({ roles: [ makeRole({ name: 'Buyer' }), makeRole({ name: 'Seller' }) ] });
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Buyer'));
    expect(el.textContent).not.toContain('Step 1');
  });

  it('keeps Send disabled until every role is configured', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }), makeRole({ name: 'Seller' }) ] });
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Buyer'));
    expect(buttonNamed(el, 'Send')?.disabled).toBe(true);
    expect(el.textContent).toContain('Paige Turner \u00b7 paige@example.com');
    expect(el.textContent).toContain('Configure recipient');
  });

  it('enables Send once every role carries a name and email', async () => {
    template = makeTemplate({
      roles: [ filledRole({ name: 'Buyer' }), filledRole({ name: 'Seller', first_name: 'Rita', last_name: 'Booke', email: 'rita@example.com' }) ],
    });
    const el = await mountSend();

    await vi.waitFor(() => expect(buttonNamed(el, 'Send')?.disabled).toBe(false));
    expect(el.textContent).not.toContain('Recipients cannot share the same email.');
  });

  it('blocks the send when two recipients share an email', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }), filledRole({ name: 'Seller' }) ] });
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Recipients cannot share the same email.'));
    expect(buttonNamed(el, 'Send')?.disabled).toBe(true);
  });

  it('merges a contact picked in the detail view into its role', async () => {
    template = makeTemplate({ roles: [ makeRole({ name: 'Buyer' }) ] });
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Buyer'));
    rowNamed(el, 'Buyer')?.click();

    await vi.waitFor(() => expect(el.querySelector('vdocs-contact-picker')).not.toBeNull());
    await page.getByLabelText('First name').fill('Paige');
    await page.getByLabelText('Last name').fill('Turner');
    await page.getByLabelText('Email').fill('paige@example.com');
    await page.getByRole('button', { name: 'Done' }).click();

    await vi.waitFor(() => expect(el.textContent).toContain('Paige Turner \u00b7 paige@example.com'));
    expect(buttonNamed(el, 'Send')?.disabled).toBe(false);
  });

  it('hides the picker cancel button inside the recipient view', async () => {
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Signer 1'));
    rowNamed(el, 'Signer 1')?.click();

    await vi.waitFor(() => expect(el.querySelector('vdocs-contact-picker')).not.toBeNull());

    // The card's own Cancel button is still in the (off-canvas) main pane, so this looks inside
    // the picker rather than the whole element.
    const picker = el.querySelector<HTMLElement>('vdocs-contact-picker')!;
    expect(buttonNamed(picker, 'Cancel')).toBeUndefined();
    expect(buttonNamed(picker, 'Done')).toBeDefined();
  });

  it('labels the brand row with the organization default when there is one', async () => {
    brands = [ makeBrand() ];
    organization = { id: ORGANIZATION_ID, default_brand_id: 'brand-1' } as IOrganization;
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Default (Acme Corp)'));
  });

  it('falls back to Verdocs styling in the brand row when the organization has no default', async () => {
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Default (Verdocs)'));
  });

  it('offers the Creating a Brand hint when the organization has no brands', async () => {
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Default (Verdocs)'));
    rowNamed(el, 'Brand')?.click();

    await vi.waitFor(() => expect(el.textContent).toContain('Creating a Brand'));
    expect(el.querySelector<HTMLAnchorElement>('a[target="_blank"]')?.href).toBe('https://app.verdocs.com/settings/branding');
  });

  it('clamps the expiration to 120 days and treats a blank field as the default', async () => {
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Signer 1'));
    rowNamed(el, 'Expires')?.click();

    const field = () => el.querySelector<HTMLInputElement>('input[aria-label="Expires in days"]');
    await vi.waitFor(() => expect(field()).not.toBeNull());

    await page.getByLabelText('Expires in days').fill('999');
    await vi.waitFor(() => expect(field()?.value).toBe('120'));

    await page.getByLabelText('Expires in days').fill('30');
    await vi.waitFor(() => expect(field()?.value).toBe('30'));

    await page.getByRole('button', { name: 'Done' }).click();
    await vi.waitFor(() => expect(rowNamed(el, 'Expires')?.textContent).toContain('30 days'));

    rowNamed(el, 'Expires')?.click();
    await vi.waitFor(() => expect(field()).not.toBeNull());
    await page.getByLabelText('Expires in days').fill('');
    await page.getByRole('button', { name: 'Done' }).click();

    await vi.waitFor(() => expect(rowNamed(el, 'Expires')?.textContent).toContain('120 days'));
  });

  it('switches the notifications row to Off when they are disabled', async () => {
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('Signer 1'));
    expect(rowNamed(el, 'Notifications')?.textContent).toContain('On');

    rowNamed(el, 'Notifications')?.click();
    await vi.waitFor(() => expect(el.querySelector('vdocs-checkbox')).not.toBeNull());

    await page.getByLabelText('Disable notifications').click();
    await vi.waitFor(() => expect(el.textContent).toContain('Disabling notifications turns off invitations'));

    await page.getByRole('button', { name: 'Done' }).click();
    await vi.waitFor(() => expect(rowNamed(el, 'Notifications')?.textContent).toContain('Off'));
  });

  it('posts the envelope request and reports the result', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });
    const sent: ISentEventDetail[] = [];
    const el = await mountSend(send => {
      send.environment = 'web';
    });
    el.addEventListener('vdocs-send', e => sent.push(e.detail));

    await vi.waitFor(() => expect(buttonNamed(el, 'Send')?.disabled).toBe(false));
    buttonNamed(el, 'Send')?.click();

    await vi.waitFor(() => expect(sentRequests()).toHaveLength(1));

    const request = sentRequests()[0];
    expect(request).toMatchObject({
      template_id: TEMPLATE_ID,
      name: 'Offer Letter',
      environment: 'web',
      initial_reminder: 0,
      followup_reminders: 0,
      no_contact: false,
    });
    expect(request.brand_key).toBeUndefined();
    expect(typeof request.expires_at).toBe('string');
    expect(request.recipients).toMatchObject([ { role_name: 'Buyer', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } ]);

    await vi.waitFor(() => expect(sent.at(-1)?.envelope_id).toBe('envelope-1'));
  });

  it('sends the chosen brand and clears it again afterwards', async () => {
    brands = [ makeBrand() ];
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });
    const el = await mountSend(send => {
      send.brandKey = 'acme';
    });

    await vi.waitFor(() => expect(buttonNamed(el, 'Send')?.disabled).toBe(false));
    expect(rowNamed(el, 'Brand')?.textContent).toContain('Acme Corp');

    buttonNamed(el, 'Send')?.click();

    await vi.waitFor(() => expect(sentRequests()).toHaveLength(1));
    expect(sentRequests()[0].brand_key).toBe('acme');

    await vi.waitFor(() => expect(rowNamed(el, 'Brand')?.textContent).toContain('Default (Verdocs)'));
  });

  it('cancels the send when a host calls preventDefault on vdocs-before-send', async () => {
    template = makeTemplate({ roles: [ filledRole({ name: 'Buyer' }) ] });
    const details: ISendEventDetail[] = [];
    const el = await mountSend();
    el.addEventListener('vdocs-before-send', e => {
      details.push(e.detail);
      e.preventDefault();
    });

    await vi.waitFor(() => expect(buttonNamed(el, 'Send')?.disabled).toBe(false));
    buttonNamed(el, 'Send')?.click();

    await vi.waitFor(() => expect(details).toHaveLength(1));
    expect(details[0]?.template.id).toBe(TEMPLATE_ID);
    expect(sentRequests()).toHaveLength(0);
  });

  it('fires vdocs-cancel, and hides the button when the host has its own way out', async () => {
    let canceled = 0;
    const el = await mountSend();
    el.addEventListener('vdocs-cancel', () => {
      canceled++;
    });

    await vi.waitFor(() => expect(el.textContent).toContain('Signer 1'));
    buttonNamed(el, 'Cancel')?.click();
    expect(canceled).toBe(1);

    el.showCancel = false;
    await el.updateComplete;
    expect(buttonNamed(el, 'Cancel')).toBeUndefined();
  });

  it('renders nothing for a template that is not sendable', async () => {
    template = makeTemplate({ is_sendable: false });
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent?.trim()).toBe(''));
  });

  it('refuses to render without a session', async () => {
    endpoint.clearSession();
    const el = await mountSend();

    await vi.waitFor(() => expect(el.textContent).toContain('You must be authenticated to use this module.'));
  });
});
