import axios from 'axios';
import { page } from 'vitest/browser';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import { getStatusColor, getStatusMessage } from './vdocs-status-indicator.js';
import type { IDocumentPageInfo } from './vdocs-envelope-document-page.js';
import type { IEnvelopeUpdatedEvent } from './vdocs-envelope-sidebar.js';
import type { IContactSelectEvent } from './vdocs-contact-picker.js';
import { invalidateEnvelopeLists } from '../store/envelopes.js';
import type { IEnvelopeEvent } from './vdocs-envelopes-list.js';
import { makeTestJwt, mount } from '../test/helpers.js';
import './vdocs-envelope-recipient-summary.js';
import './vdocs-envelope-update-recipient.js';
import './vdocs-envelope-recipient-link.js';
import './vdocs-envelope-document-page.js';
import './vdocs-envelope-sidebar.js';
import './vdocs-status-indicator.js';
import './vdocs-contact-picker.js';
import './vdocs-envelopes-list.js';
import './vdocs-sign-footer.js';

// A 1x1 transparent PNG, enough for the document page's onload/geometry path.
const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let envSeq = 0;
const nextEnvId = () => `env-${++envSeq}`;

const makeRecipient = (overrides: Partial<IRecipient> = {}): IRecipient =>
  ({
    role_name: 'Signer 1',
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@example.com',
    phone: '',
    status: 'pending',
    sequence: 1,
    order: 1,
    ...overrides,
  }) as IRecipient;

const makeEnvelope = (overrides: Partial<IEnvelope> = {}): IEnvelope =>
  ({
    id: 'env-1',
    name: 'Test Envelope',
    status: 'in progress',
    profile_id: 'profile-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    canceled_at: '2026-02-01T00:00:00Z',
    initial_reminder: null,
    followup_reminders: null,
    next_reminder: null,
    recipients: [ makeRecipient() ],
    history_entries: [],
    ...overrides,
  }) as IEnvelope;

let mock: MockAdapter;
let endpoint: VerdocsEndpoint;

beforeEach(() => {
  localStorage.clear();
  // The list store is module-level; drop it so each test observes its own requests.
  invalidateEnvelopeLists();

  mock = new MockAdapter(axios);
  endpoint = new VerdocsEndpoint({ baseURL: 'https://stage-api.verdocs.com' });
  endpoint.setDefault();
});

afterEach(() => {
  mock.restore();
  document.body.replaceChildren();
});

// Sign in as the given profile so owner-gated features render. getCurrentProfile
// reads /v2/profiles and picks the entry flagged `current`.
const authenticateAs = (profileId: string) => {
  mock.onGet('/v2/profiles').reply(200, [ { id: profileId, current: true, first_name: 'Owner', last_name: 'User', email: 'owner@example.com' } ]);
  endpoint.setToken(makeTestJwt({ profile_id: profileId }));
};

describe('vdocs-status-indicator', () => {
  const cases: [string, string][] = [
    [ 'pending', 'Pending' ],
    [ 'complete', 'Completed' ],
    [ 'declined', 'Declined' ],
    [ 'canceled', 'Cancelled' ],
    [ 'in progress', 'In Progress' ],
    [ 'invited', 'Invited' ],
    [ 'opened', 'Opened' ],
    [ 'signed', 'Signed' ],
    [ 'accepted', 'Accepted' ],
    [ 'submitted', 'Submitted' ],
  ];

  it.each(cases)('maps status %s to its label and an icon', async (status, message) => {
    const el = await mount(document.createElement('vdocs-status-indicator'));
    el.status = status as IEnvelope['status'];
    await el.updateComplete;

    expect(el.textContent?.trim()).toBe(message);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('derives "Partly Signed" from an envelope with some submitted recipients', async () => {
    const el = await mount(document.createElement('vdocs-status-indicator'));
    el.envelope = makeEnvelope({
      status: 'in progress',
      recipients: [ makeRecipient({ status: 'submitted' }), makeRecipient({ role_name: 'Signer 2', status: 'pending' }) ],
    });
    await el.updateComplete;

    expect(el.textContent).toContain('Partly Signed');
  });

  it('exports getStatusMessage and getStatusColor helpers', () => {
    expect(getStatusMessage('complete')).toBe('Completed');
    expect(getStatusMessage('unknown-status')).toBe('unknown-status');
    expect(getStatusColor('declined')).toBe('#ff0000');
    expect(getStatusColor('complete')).toContain('--vdocs-color-primary');
  });
});

describe('vdocs-envelopes-list', () => {
  const envelopes = [
    makeEnvelope({ id: 'e-1', name: 'Onboarding', recipients: [ makeRecipient({ first_name: 'Ada', last_name: 'Byte' }) ] }),
    makeEnvelope({ id: 'e-2', name: 'NDA' }),
  ];

  const renderList = async () => {
    const el = await mount(document.createElement('vdocs-envelopes-list'));
    await vi.waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/envelopes')).toBe(true);
    });
    return el;
  };

  it('renders a row per envelope with the legacy-exact default query params', async () => {
    mock.onGet('/v2/envelopes').reply(200, { count: 2, rows: 2, page: 0, envelopes });

    const el = await renderList();
    await vi.waitFor(() => {
      expect(el.textContent).toContain('Onboarding');
      expect(el.textContent).toContain('NDA');
    });

    const request = mock.history.get.find(r => r.url === '/v2/envelopes');
    expect(request?.params).toEqual(expect.objectContaining({ sort_by: 'created_at', page: 0, rows: 10 }));
    expect(request?.params.status).toEqual([ 'pending', 'in progress', 'complete', 'declined', 'canceled' ]);
  });

  it('fires vdocs-view-envelope when a row is clicked', async () => {
    mock.onGet('/v2/envelopes').reply(200, { count: 2, rows: 2, page: 0, envelopes });

    const events: IEnvelopeEvent[] = [];
    const el = await renderList();
    el.addEventListener('vdocs-view-envelope', e => events.push(e.detail));

    await vi.waitFor(() => expect(el.textContent).toContain('Onboarding'));
    await page.getByText('Onboarding').click();

    expect(events.map(event => event.envelope.id)).toEqual([ 'e-1' ]);
  });

  it('re-queries with the pinned view statuses and fires vdocs-change-view', async () => {
    mock.onGet('/v2/envelopes').reply(200, { count: 2, rows: 2, page: 0, envelopes });

    const changes: string[] = [];
    const el = await renderList();
    el.addEventListener('vdocs-change-view', e => changes.push(e.detail));

    await page.getByRole('button', { name: /View/ }).click();
    await page.getByRole('option', { name: 'Sent', exact: true }).click();

    expect(changes).toEqual([ 'sent' ]);
    await vi.waitFor(() => {
      expect(mock.history.get.some(r => r.url === '/v2/envelopes' && r.params?.view === 'sent')).toBe(true);
    });
  });

  it('disables the Cancel row action for non-owners', async () => {
    mock.onGet('/v2/envelopes').reply(200, { count: 1, rows: 1, page: 0, envelopes: [ envelopes[0] ] });

    const el = await renderList();
    await vi.waitFor(() => expect(el.textContent).toContain('Onboarding'));

    el.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!.click();
    await vi.waitFor(() => expect(el.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0));

    const cancelItem = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find(item => item.textContent?.trim() === 'Cancel');
    expect(cancelItem?.disabled).toBe(true);
  });

  it('shows the empty state when no envelopes match', async () => {
    mock.onGet('/v2/envelopes').reply(200, { count: 0, rows: 0, page: 0, envelopes: [] });

    const el = await renderList();
    await vi.waitFor(() => expect(el.textContent).toContain('No matching envelopes found'));
  });
});

describe('vdocs-envelope-recipient-link', () => {
  const mountLink = async (configure?: (el: HTMLElementTagNameMap['vdocs-envelope-recipient-link']) => void) => {
    const el = document.createElement('vdocs-envelope-recipient-link');
    el.recipient = makeRecipient({ role_name: 'Buyer', email: 'buyer@example.com' });
    configure?.(el);
    return mount(el);
  };

  it('renders the recipient and a Get Link button', async () => {
    const el = await mountLink();
    expect(el.textContent).toContain('Buyer');
    expect(el.textContent).toContain('Alice Smith');
    expect(page.getByRole('button', { name: 'Get Link' })).toBeDefined();
  });

  it('fires vdocs-get-link with the recipient when Get Link is clicked', async () => {
    const events: IRecipient[] = [];
    const el = await mountLink();
    el.addEventListener('vdocs-get-link', e => events.push(e.detail));

    await page.getByRole('button', { name: 'Get Link' }).click();
    expect(events).toHaveLength(1);
    expect(events[0]?.role_name).toBe('Buyer');
  });

  it('shows the link and a Copy button once a link is set, hiding Get Link', async () => {
    const el = await mountLink(link => {
      link.link = 'https://verdocs.test/sign/abc';
    });

    expect(el.textContent).toContain('https://verdocs.test/sign/abc');
    expect(el.querySelector('vdocs-button[label="Copy"]')).not.toBeNull();
    expect(el.querySelector('vdocs-button[label="Get Link"]')).toBeNull();
  });

  it('fires vdocs-link-done when Done is clicked', async () => {
    let done = false;
    const el = await mountLink();
    el.addEventListener('vdocs-link-done', () => {
      done = true;
    });

    await page.getByRole('button', { name: 'Done' }).click();
    expect(done).toBe(true);
  });
});

describe('vdocs-sign-footer', () => {
  it('renders the organization branding links', async () => {
    const el = await mount(document.createElement('vdocs-sign-footer'));
    el.organization = { powered_by_label: 'Powered by Acme', terms_use_url: 'https://acme.test/terms', privacy_policy_url: 'https://acme.test/privacy' };
    await el.updateComplete;

    expect(el.textContent).toContain('Powered by Acme');
    expect(el.textContent).toContain('Terms of Use');
    expect(el.textContent).toContain('Privacy Policy');
  });

  it('fires vdocs-decline and vdocs-finish-later', async () => {
    let declined = false;
    let finishLater = false;
    const el = await mount(document.createElement('vdocs-sign-footer'));
    el.addEventListener('vdocs-decline', () => {
      declined = true;
    });
    el.addEventListener('vdocs-finish-later', () => {
      finishLater = true;
    });

    await page.getByRole('button', { name: /Decline Signing/ }).click();
    await page.getByRole('button', { name: /Finish Later/ }).click();
    expect(declined).toBe(true);
    expect(finishLater).toBe(true);
  });

  it('opens the question dialog and fires vdocs-ask-question with the entered text', async () => {
    const questions: string[] = [];
    const el = await mount(document.createElement('vdocs-sign-footer'));
    el.addEventListener('vdocs-ask-question', e => questions.push(e.detail));

    await page.getByRole('button', { name: /Ask Sender a Question/ }).click();
    await vi.waitFor(() => expect(document.querySelector('textarea[aria-label="Question"]')).not.toBeNull());

    await page.getByLabelText('Question').fill('When does this expire?');
    await page.getByRole('button', { name: 'OK' }).click();

    expect(questions).toEqual([ 'When does this expire?' ]);
  });

  it('hides the action buttons when isDone is set', async () => {
    const el = await mount(document.createElement('vdocs-sign-footer'));
    el.isDone = true;
    await el.updateComplete;

    expect(el.textContent).not.toContain('Decline Signing');
  });
});

describe('vdocs-envelope-document-page', () => {
  it('renders the page image with a numbered alt', async () => {
    const el = await mount(document.createElement('vdocs-envelope-document-page'));
    el.pageImageUri = PIXEL_PNG;
    el.pageNumber = 3;
    await el.updateComplete;

    const img = el.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('Page 3');
    expect(img.getAttribute('src')).toBe(PIXEL_PNG);
  });

  it('moves markup children into the overlay layer', async () => {
    const el = document.createElement('vdocs-envelope-document-page');
    el.pageImageUri = PIXEL_PNG;
    const field = document.createElement('div');
    field.textContent = 'Field overlay';
    field.className = 'test-field';
    el.appendChild(field);
    await mount(el);

    const overlay = el.querySelector('.vdocs\\:absolute')!;
    expect(overlay.querySelector('.test-field')).not.toBeNull();
  });

  it('fires vdocs-page-rendered with geometry once the image loads', async () => {
    const infos: IDocumentPageInfo[] = [];
    const el = document.createElement('vdocs-envelope-document-page');
    el.pageImageUri = PIXEL_PNG;
    el.pageNumber = 2;
    el.addEventListener('vdocs-page-rendered', e => infos.push(e.detail));
    await mount(el);

    await vi.waitFor(() => expect(infos.length).toBeGreaterThan(0));
    expect(infos[0]?.pageNumber).toBe(2);
    expect(infos[0]?.naturalWidth).toBeGreaterThan(0);
    expect(infos[0]?.xScale).toBeGreaterThan(0);
  });
});

describe('vdocs-contact-picker', () => {
  it('keeps OK disabled until name and a valid email are entered', async () => {
    const el = await mount(document.createElement('vdocs-contact-picker'));
    const okButton = () => Array.from(el.querySelectorAll('button')).find(b => b.textContent?.trim() === 'OK');

    expect(okButton()?.disabled).toBe(true);

    await page.getByLabelText('First name').fill('Bob');
    await page.getByLabelText('Last name').fill('Jones');
    await page.getByPlaceholder('Invite/verify via email...').fill('bob@example.com');

    await vi.waitFor(() => expect(okButton()?.disabled).toBe(false));
  });

  it('fires vdocs-submit-contact with the completed details', async () => {
    const submissions: IContactSelectEvent[] = [];
    const el = await mount(document.createElement('vdocs-contact-picker'));
    el.addEventListener('vdocs-submit-contact', e => submissions.push(e.detail));

    await page.getByLabelText('First name').fill('Bob');
    await page.getByLabelText('Last name').fill('Jones');
    await page.getByPlaceholder('Invite/verify via email...').fill('bob@example.com');
    await page.getByRole('button', { name: 'OK' }).click();

    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toEqual(expect.objectContaining({ first_name: 'Bob', last_name: 'Jones', email: 'bob@example.com' }));
  });

  it('fires vdocs-search-contacts as the user types a name', async () => {
    const queries: string[] = [];
    const el = await mount(document.createElement('vdocs-contact-picker'));
    el.addEventListener('vdocs-search-contacts', e => queries.push(e.detail));

    await page.getByLabelText('First name').fill('Al');
    expect(queries.at(-1)).toBe('Al');
  });

  it('fills the form when a suggestion is selected', async () => {
    const el = await mount(document.createElement('vdocs-contact-picker'));
    el.suggestions = [ { id: 's-1', first_name: 'Alice', last_name: 'Johnson', email: 'alice.j@example.com' } ];
    await el.updateComplete;

    await page.getByLabelText('First name').fill('Ali');
    await vi.waitFor(() => expect(document.body.textContent).toContain('alice.j@example.com'));
    await page.getByText('Alice Johnson').click();

    await vi.waitFor(() => {
      expect(el.querySelector<HTMLInputElement>('input[aria-label="First name"]')?.value).toBe('Alice');
    });
  });
});

describe('vdocs-envelope-recipient-summary', () => {
  const mountSummary = async (envelope: IEnvelope) => {
    mock.onGet(`/v2/envelopes/${envelope.id}`).reply(200, envelope);
    const el = document.createElement('vdocs-envelope-recipient-summary');
    el.envelopeId = envelope.id;
    await mount(el);
    await vi.waitFor(() => expect(el.textContent).toContain('Recipient Summary'));
    return el;
  };

  it('loads the envelope and lists each recipient with a status chip', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), recipients: [ makeRecipient({ role_name: 'Buyer', status: 'pending' }) ] });
    const el = await mountSummary(envelope);

    expect(el.textContent).toContain('Buyer');
    expect(el.textContent).toContain('pending');
  });

  it('fires vdocs-done with the envelope when Done is clicked', async () => {
    const envelope = makeEnvelope({ id: nextEnvId() });
    const events: IEnvelopeEvent[] = [];
    const el = await mountSummary(envelope);
    el.addEventListener('vdocs-done', e => events.push(e.detail));

    await page.getByRole('button', { name: 'Done' }).click();
    expect(events).toHaveLength(1);
    expect(events[0]?.envelope.id).toBe(envelope.id);
  });

  it('fetches and displays an in-person link for an actionable recipient', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), status: 'in progress', recipients: [ makeRecipient({ role_name: 'Buyer', status: 'pending', sequence: 1 }) ] });
    mock.onPost(new RegExp(`/v2/sign/in-person/${envelope.id}/`)).reply(200, { link: 'https://verdocs.test/ip/xyz', access_token: 't' });
    const el = await mountSummary(envelope);

    await page.getByRole('button', { name: 'Get Link' }).click();
    await vi.waitFor(() => expect(el.textContent).toContain('https://verdocs.test/ip/xyz'));
  });

  it('shows a component error when the envelope fails to load', async () => {
    const id = nextEnvId();
    mock.onGet(`/v2/envelopes/${id}`).reply(500);
    const el = document.createElement('vdocs-envelope-recipient-summary');
    el.envelopeId = id;
    await mount(el);

    await vi.waitFor(() => expect(el.textContent).toContain('Unable to load envelope'));
  });
});

describe('vdocs-envelope-update-recipient', () => {
  const mountUpdate = async (envelope: IEnvelope, roleName: string) => {
    mock.onGet(`/v2/envelopes/${envelope.id}`).reply(200, envelope);
    const el = document.createElement('vdocs-envelope-update-recipient');
    el.envelopeId = envelope.id;
    el.roleName = roleName;
    await mount(el);
    await vi.waitFor(() => expect(document.body.textContent).toContain('Update Recipient'));
    return el;
  };

  it('loads the recipient and prefills the form', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), recipients: [ makeRecipient({ role_name: 'Buyer', first_name: 'Ada', last_name: 'Byte' }) ] });
    await mountUpdate(envelope, 'Buyer');

    const firstName = document.querySelector<HTMLInputElement>('vdocs-text-input input[type="text"]');
    expect(firstName?.value).toBe('Ada');
  });

  it('submits only changed fields and fires vdocs-updated', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), recipients: [ makeRecipient({ role_name: 'Buyer', first_name: 'Ada', last_name: 'Byte', email: 'ada@example.com' }) ] });
    mock.onPatch(new RegExp(`/v2/envelopes/${envelope.id}/recipients/`)).reply(200, makeRecipient({ role_name: 'Buyer', first_name: 'Adabella' }));

    const updated: IRecipient[] = [];
    const el = await mountUpdate(envelope, 'Buyer');
    el.addEventListener('vdocs-updated', e => updated.push(e.detail));

    const firstName = document.querySelector<HTMLInputElement>('vdocs-text-input input[type="text"]')!;
    firstName.value = 'Adabella';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));

    await page.getByRole('button', { name: 'Save' }).click();

    await vi.waitFor(() => expect(updated).toHaveLength(1));
    const patch = mock.history.patch.find(r => r.url?.includes('/recipients/'));
    expect(JSON.parse(String(patch?.data))).toEqual({ first_name: 'Adabella' });
  });

  it('fires vdocs-cancel without a request when nothing changed', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), recipients: [ makeRecipient({ role_name: 'Buyer' }) ] });
    let canceled = false;
    const el = await mountUpdate(envelope, 'Buyer');
    el.addEventListener('vdocs-cancel', () => {
      canceled = true;
    });

    await page.getByRole('button', { name: 'Save' }).click();
    expect(canceled).toBe(true);
    expect(mock.history.patch).toHaveLength(0);
  });
});

describe('vdocs-envelope-sidebar', () => {
  const mountSidebar = async (envelope: IEnvelope, authenticate = false) => {
    mock.onGet(`/v2/envelopes/${envelope.id}`).reply(200, envelope);
    if (authenticate) {
      authenticateAs(envelope.profile_id);
    }
    const el = document.createElement('vdocs-envelope-sidebar');
    el.envelopeId = envelope.id;
    await mount(el);
    return el;
  };

  it('opens a panel when a tab is clicked and fires vdocs-toggle-panel', async () => {
    const envelope = makeEnvelope({ id: nextEnvId() });
    const toggles: boolean[] = [];
    const el = await mountSidebar(envelope);
    el.addEventListener('vdocs-toggle-panel', e => toggles.push(e.detail));

    await page.getByRole('tab', { name: 'Details' }).click();
    await vi.waitFor(() => expect(el.textContent).toContain('Envelope ID'));
    expect(toggles.at(-1)).toBe(true);

    await page.getByRole('tab', { name: 'Details' }).click();
    expect(toggles.at(-1)).toBe(false);
  });

  it('renders the history timeline', async () => {
    const envelope = makeEnvelope({
      id: nextEnvId(),
      history_entries: [ { id: 'h1', envelope_id: 'x', role_name: 'Signer 1', event: 'recipient:signed', event_detail: '', created_at: '2026-02-02T00:00:00Z' } ] as IEnvelope['history_entries'],
    });
    const el = await mountSidebar(envelope);

    await page.getByRole('tab', { name: 'History' }).click();
    await vi.waitFor(() => expect(el.textContent).toContain('Envelope created.'));
    expect(el.textContent).toContain('Signed by Alice Smith.');
  });

  it('lets the owner send a reminder and fires vdocs-envelope-updated', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), status: 'in progress', recipients: [ makeRecipient({ role_name: 'Buyer', status: 'invited', sequence: 1 }) ] });
    mock.onPatch(new RegExp(`/v2/envelopes/${envelope.id}/recipients/`)).reply(200, { status: 'OK' });

    const updates: IEnvelopeUpdatedEvent[] = [];
    const el = await mountSidebar(envelope, true);
    el.addEventListener('vdocs-envelope-updated', e => updates.push(e.detail));

    await page.getByRole('tab', { name: 'Recipients' }).click();
    await vi.waitFor(() => expect(el.querySelector('button[aria-label="Open menu"]')).not.toBeNull());

    el.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!.click();
    await vi.waitFor(() => expect(el.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0));
    Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find(i => i.textContent?.trim() === 'Send Reminder')!.click();

    await vi.waitFor(() => expect(updates.some(u => u.event === 'reminder')).toBe(true));
    const patch = mock.history.patch.find(r => r.url?.includes('/recipients/'));
    expect(JSON.parse(String(patch?.data))).toEqual({ action: 'remind' });
  });

  it('lets the owner cancel the envelope through the confirm dialog', async () => {
    const envelope = makeEnvelope({ id: nextEnvId(), status: 'in progress' });
    mock.onPut(`/v2/envelopes/${envelope.id}`).reply(200, { ...envelope, status: 'canceled' });

    const updates: IEnvelopeUpdatedEvent[] = [];
    const el = await mountSidebar(envelope, true);
    el.addEventListener('vdocs-envelope-updated', e => updates.push(e.detail));

    await page.getByRole('tab', { name: 'Recipients' }).click();
    await page.getByRole('button', { name: 'Cancel Envelope' }).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Are you sure you want to cancel'));
    await page.getByRole('button', { name: 'OK' }).click();

    await vi.waitFor(() => expect(updates.some(u => u.event === 'canceled')).toBe(true));
    const put = mock.history.put.find(r => r.url === `/v2/envelopes/${envelope.id}`);
    expect(JSON.parse(String(put?.data))).toEqual({ action: 'cancel' });
  });
});
