import axios from 'axios';
import { page } from 'vitest/browser';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IRole, ITemplate, ITemplateDocument, ITemplateField } from '@verdocs/js-sdk';
import { invalidateTemplateDetail } from '../store/template-detail.js';
import { invalidateTemplateLists } from '../store/templates.js';
import { TEST_API_BASE } from '../test/helpers.js';
import './vdocs-template-field-properties.js';
import './vdocs-template-role-properties.js';
import './vdocs-template-document-page.js';
import './vdocs-template-attachments.js';
import './vdocs-template-build-tabs.js';
import './vdocs-template-settings.js';
import './vdocs-template-create.js';
import './vdocs-template-fields.js';
import './vdocs-template-roles.js';
import './vdocs-template-card.js';
import './vdocs-template-tags.js';

const TEMPLATE_ID = 'template-1';

const makeRole = (overrides: Partial<IRole> = {}): IRole =>
  ({
    template_id: TEMPLATE_ID,
    name: 'Recipient 1',
    type: 'signer',
    full_name: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: null,
    sequence: 1,
    order: 1,
    delegator: false,
    name_locked: false,
    ...overrides,
  }) as IRole;

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField =>
  ({
    template_id: TEMPLATE_ID,
    document_id: 'doc-1',
    name: 'Field1',
    role_name: 'Recipient 1',
    type: 'textbox',
    required: false,
    readonly: false,
    label: null,
    group: null,
    placeholder: null,
    default: null,
    settings: null,
    options: null,
    page: 1,
    x: 100,
    y: 200,
    width: 150,
    height: 24,
    ...overrides,
  }) as ITemplateField;

const makeDocument = (overrides: Partial<ITemplateDocument> = {}): ITemplateDocument =>
  ({
    id: 'doc-1',
    template_id: TEMPLATE_ID,
    name: 'Agreement.pdf',
    mime: 'application/pdf',
    pages: 1,
    page_sizes: { 1: { width: 612, height: 792 } },
    ...overrides,
  }) as unknown as ITemplateDocument;

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: TEMPLATE_ID,
    name: 'Lease Agreement',
    counter: 4,
    star_counter: 0,
    visibility: 'private',
    sender: 'envelope_creator',
    roles: [],
    fields: [],
    documents: [ makeDocument() ],
    ...overrides,
  }) as ITemplate;

let mock: MockAdapter;

beforeEach(() => {
  localStorage.clear();
  // The stores are module-level and cache by key; drop both so every test
  // observes its own requests.
  invalidateTemplateLists();
  invalidateTemplateDetail(TEMPLATE_ID).catch(() => undefined);

  mock = new MockAdapter(axios);
  mock.onGet('/v2/profiles').reply(200, []);
  new VerdocsEndpoint({ baseURL: TEST_API_BASE }).setDefault();
});

afterEach(() => {
  mock.restore();
  // Clears mounted elements and any body-portaled panels/dialogs.
  document.body.replaceChildren();
});

/** Create an element, assign properties, mount it, and wait for the first render. */
const render = async <K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}): Promise<HTMLElementTagNameMap[K]> => {
  const el = document.createElement(tag);
  Object.assign(el, props);
  document.body.appendChild(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

/** Set a native input/select value the way a user edit would, firing the matching event. */
const setValue = (control: HTMLInputElement | HTMLSelectElement, value: string, event = 'input') => {
  control.value = value;
  control.dispatchEvent(new Event(event, { bubbles: true }));
};

describe('vdocs-template-tags', () => {
  it('renders a chip per tag', async () => {
    const el = await render('vdocs-template-tags', { tags: [ 'NDA', 'Legal' ] });
    const chips = el.querySelectorAll('span');
    expect(chips).toHaveLength(2);
    expect(el.textContent).toContain('NDA');
    expect(el.textContent).toContain('Legal');
  });

  it('renders nothing when there are no tags', async () => {
    const el = await render('vdocs-template-tags');
    expect(el.querySelectorAll('span')).toHaveLength(0);
  });

  it('updates when the tags change', async () => {
    const el = await render('vdocs-template-tags', { tags: [ 'One' ] });
    el.tags = [ 'One', 'Two', 'Three' ];
    await el.updateComplete;
    expect(el.querySelectorAll('span')).toHaveLength(3);
  });
});

describe('vdocs-template-card', () => {
  it('renders the name, organization, and usage counter', async () => {
    const template = makeTemplate({ name: 'Sales Deck', organization: { name: 'Acme' } } as Partial<ITemplate>);
    const el = await render('vdocs-template-card', { template });
    expect(el.textContent).toContain('Sales Deck');
    expect(el.textContent).toContain('Acme');
    expect(el.textContent).toContain('4');
  });

  it('falls back to Public when there is no organization', async () => {
    const el = await render('vdocs-template-card', { template: makeTemplate({ organization: undefined }) });
    expect(el.textContent).toContain('Public');
  });

  it('fires vdocs-select-template with the template on click', async () => {
    const template = makeTemplate({ name: 'Clickable' });
    const el = await render('vdocs-template-card', { template });
    const events: ITemplate[] = [];
    el.addEventListener('vdocs-select-template', e => events.push((e as CustomEvent<ITemplate>).detail));

    el.querySelector<HTMLElement>('div')!.click();
    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe(TEMPLATE_ID);
  });
});

describe('vdocs-template-document-page', () => {
  it('renders a placeholder until the page image arrives', async () => {
    const el = await render('vdocs-template-document-page', { pageNumber: 1 });
    expect(el.querySelector('[data-testid="page-placeholder"]')).not.toBeNull();
    expect(el.querySelector('img')).toBeNull();
  });

  it('renders the page image with page-number alt text', async () => {
    const el = await render('vdocs-template-document-page', { pageImageUri: 'https://img/p1.png', pageNumber: 2 });
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://img/p1.png');
    expect(img.getAttribute('alt')).toBe('Page 2');
  });

  it('renders the supplied field-layer content', async () => {
    const { html } = await import('lit');
    const el = await render('vdocs-template-document-page', { content: html`<div data-testid="marker">field</div>` });
    expect(el.querySelector('[data-testid="marker"]')).not.toBeNull();
  });
});

describe('vdocs-template-build-tabs', () => {
  it('disables later steps until the template has content', async () => {
    const el = await render('vdocs-template-build-tabs', { selectedStep: 'attachments', template: null });
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const labels = tabs.map(tab => tab.textContent?.trim());
    expect(labels).toEqual([ 'Attachments', 'Workflow', 'Fields', 'Preview & Send' ]);
    // Only Attachments is enabled with no documents/roles/fields.
    expect(tabs.filter(tab => !tab.disabled).map(tab => tab.textContent?.trim())).toEqual([ 'Attachments' ]);
  });

  it('enables Workflow once the template has a document', async () => {
    const el = await render('vdocs-template-build-tabs', { selectedStep: 'attachments', template: makeTemplate() });
    const workflow = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(tab => tab.textContent?.includes('Workflow'))!;
    expect(workflow.disabled).toBe(false);
  });

  it('fires vdocs-select-step when an enabled tab is chosen', async () => {
    const steps: string[] = [];
    const el = await render('vdocs-template-build-tabs', { selectedStep: 'attachments', template: makeTemplate() });
    el.addEventListener('vdocs-select-step', e => steps.push((e as CustomEvent<string>).detail));

    await page.getByRole('tab', { name: 'Workflow' }).click();
    expect(steps).toEqual([ 'roles' ]);
  });
});

describe('vdocs-template-create', () => {
  const selectFile = (el: HTMLElement, name = 'Contract.pdf') => {
    const file = new File([ 'x' ], name, { type: 'application/pdf' });
    el.querySelector('vdocs-file-chooser')!.dispatchEvent(new CustomEvent('vdocs-select-files', { detail: { files: [ file ] }, bubbles: true, composed: true }));
  };

  it('suggests the template name from the first selected file', async () => {
    const el = await render('vdocs-template-create');
    selectFile(el, 'Onboarding.pdf');
    await el.updateComplete;
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('Onboarding.pdf');
  });

  it('keeps Create disabled until a file and name are present', async () => {
    const el = await render('vdocs-template-create');
    const createButton = page.getByRole('button', { name: 'Create' }).element() as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);

    selectFile(el);
    await el.updateComplete;
    expect(createButton.disabled).toBe(false);
  });

  it('creates the template and fires vdocs-template-created', async () => {
    mock.onPost('/v2/templates').reply(200, makeTemplate({ id: 'created-1', name: 'Contract.pdf' }));
    const created: ITemplate[] = [];
    const el = await render('vdocs-template-create');
    el.addEventListener('vdocs-template-created', e => created.push((e as CustomEvent<ITemplate>).detail));

    selectFile(el);
    await el.updateComplete;
    await page.getByRole('button', { name: 'Create' }).click();

    await vi.waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]?.id).toBe('created-1');
    expect(mock.history.post.some(request => request.url === '/v2/templates')).toBe(true);
  });

  it('fires vdocs-cancel when Cancel is clicked', async () => {
    const cancels: unknown[] = [];
    const el = await render('vdocs-template-create');
    el.addEventListener('vdocs-cancel', () => cancels.push(true));
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(cancels).toHaveLength(1);
  });
});

describe('vdocs-template-settings', () => {
  it('loads the template into the form', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ name: 'Rental Terms' }));
    const el = await render('vdocs-template-settings', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('Settings'));
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('Rental Terms');
  });

  it('shows an error state when the template cannot load', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(500);
    const errors: unknown[] = [];
    const el = await render('vdocs-template-settings', { templateId: TEMPLATE_ID });
    el.addEventListener('vdocs-sdk-error', () => errors.push(true));
    await vi.waitFor(() => expect(el.textContent).toContain('Unable to load this template'));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('saves edits and fires vdocs-settings-changed', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ name: 'Old Name' }));
    mock.onPatch(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ name: 'New Name' }));
    const changed: Array<{ template: ITemplate }> = [];
    const el = await render('vdocs-template-settings', { templateId: TEMPLATE_ID });
    el.addEventListener('vdocs-settings-changed', e => changed.push((e as CustomEvent<{ template: ITemplate }>).detail));

    await vi.waitFor(() => expect(el.querySelector('input[type="text"]')).not.toBeNull());
    setValue(el.querySelector<HTMLInputElement>('input[type="text"]')!, 'New Name');
    await page.getByRole('button', { name: 'Save' }).click();

    await vi.waitFor(() => expect(changed).toHaveLength(1));
    expect(changed[0]?.template.name).toBe('New Name');
    const patch = mock.history.patch.find(request => request.url === `/v2/templates/${TEMPLATE_ID}`);
    expect(JSON.parse(patch!.data).name).toBe('New Name');
  });

  it('keeps Save disabled until an edit is made', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate());
    const el = await render('vdocs-template-settings', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('Settings'));
    expect((page.getByRole('button', { name: 'Save' }).element() as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('vdocs-template-role-properties', () => {
  it('renders the role into the form', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate());
    const el = await render('vdocs-template-role-properties', { templateId: TEMPLATE_ID, templateRole: makeRole({ name: 'Buyer' }) });
    await el.updateComplete;
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('Buyer');
  });

  it('locks the name when the role has fields assigned', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ fields: [ makeField({ role_name: 'Buyer' }) ] }));
    const el = await render('vdocs-template-role-properties', { templateId: TEMPLATE_ID, templateRole: makeRole({ name: 'Buyer' }) });
    await vi.waitFor(() => expect(el.textContent).toContain('can no longer be renamed'));
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.disabled).toBe(true);
  });

  it('saves changes and fires vdocs-close', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate());
    mock.onPatch(new RegExp(`/v2/roles/${TEMPLATE_ID}/`)).reply(200, makeRole({ name: 'Renamed' }));
    const closes: unknown[] = [];
    const el = await render('vdocs-template-role-properties', { templateId: TEMPLATE_ID, templateRole: makeRole({ name: 'Buyer' }) });
    el.addEventListener('vdocs-close', () => closes.push(true));

    await el.updateComplete;
    setValue(el.querySelector<HTMLInputElement>('input[type="text"]')!, 'Renamed');
    await page.getByRole('button', { name: 'Save' }).click();

    await vi.waitFor(() => expect(closes).toHaveLength(1));
    expect(mock.history.patch.some(request => request.url === `/v2/roles/${TEMPLATE_ID}/Buyer`)).toBe(true);
  });

  it('deletes the role and fires vdocs-role-deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate());
    mock.onDelete(new RegExp(`/v2/roles/${TEMPLATE_ID}/`)).reply(200, '');
    const deleted: Array<{ roleName: string }> = [];
    const el = await render('vdocs-template-role-properties', { templateId: TEMPLATE_ID, templateRole: makeRole({ name: 'Buyer' }) });
    el.addEventListener('vdocs-role-deleted', e => deleted.push((e as CustomEvent<{ roleName: string }>).detail));

    await el.updateComplete;
    await page.getByRole('button', { name: 'Delete Role' }).click();

    await vi.waitFor(() => expect(deleted).toHaveLength(1));
    expect(deleted[0]?.roleName).toBe('Buyer');
  });
});

describe('vdocs-template-roles', () => {
  it('renders role chips grouped by sequence', async () => {
    const roles = [
      makeRole({ name: 'Recipient 1', sequence: 1 }),
      makeRole({ name: 'Landlord', sequence: 2, first_name: 'Larry', last_name: 'Lord', email: 'larry@example.com' }),
    ];
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles }));
    const el = await render('vdocs-template-roles', { templateId: TEMPLATE_ID });

    await vi.waitFor(() => expect(el.textContent).toContain('Recipient 1'));
    expect(el.textContent).toContain('Larry Lord');
    expect(el.textContent).toContain('1.');
    expect(el.textContent).toContain('2.');
    // The trailing add-a-step row.
    expect(el.textContent).toContain('3.');
  });

  it('shows the empty state and disables OK with no roles', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [] }));
    const el = await render('vdocs-template-roles', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('You must add at least one Role'));
    expect((page.getByRole('button', { name: 'OK' }).element() as HTMLButtonElement).disabled).toBe(true);
  });

  it('adds a role and fires vdocs-roles-updated', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole({ name: 'Recipient 1' }) ] }));
    mock.onPost(`/v2/roles/${TEMPLATE_ID}`).reply(200, makeRole({ name: 'Recipient 2', order: 2 }));
    const updates: Array<{ event: string }> = [];
    const el = await render('vdocs-template-roles', { templateId: TEMPLATE_ID });
    el.addEventListener('vdocs-roles-updated', e => updates.push((e as CustomEvent<{ event: string }>).detail));

    await vi.waitFor(() => expect(el.textContent).toContain('Recipient 1'));
    const addButtons = el.querySelectorAll<HTMLButtonElement>('button');
    const addRole = Array.from(addButtons).find(button => button.textContent?.includes('+ Add Role'))!;
    addRole.click();

    await vi.waitFor(() => expect(updates.some(update => update.event === 'added')).toBe(true));
    expect(mock.history.post.some(request => request.url === `/v2/roles/${TEMPLATE_ID}`)).toBe(true);
  });

  it('opens the role editor from a chip', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole({ name: 'Recipient 1' }) ] }));
    const el = await render('vdocs-template-roles', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('Recipient 1'));

    await page.getByRole('button', { name: 'Edit role Recipient 1' }).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Role Name'));
  });
});

describe('vdocs-template-attachments', () => {
  it('lists the attached documents', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ documents: [ makeDocument({ name: 'Lease.pdf' }) ] }));
    const el = await render('vdocs-template-attachments', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('Lease.pdf'));
    expect(el.textContent).toContain('Existing Attachments');
  });

  it('blocks deleting the only attachment', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ documents: [ makeDocument({ name: 'Solo.pdf' }) ] }));
    const el = await render('vdocs-template-attachments', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('Solo.pdf'));

    await page.getByRole('button', { name: 'Delete Solo.pdf' }).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Templates must contain at least one attachment'));
  });

  it('confirms and deletes when more than one attachment exists', async () => {
    const documents = [ makeDocument({ id: 'doc-1', name: 'One.pdf' }), makeDocument({ id: 'doc-2', name: 'Two.pdf' }) ];
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ documents }));
    mock.onDelete('/v2/template-documents/doc-1').reply(200, '');
    const changed: unknown[] = [];
    const el = await render('vdocs-template-attachments', { templateId: TEMPLATE_ID });
    el.addEventListener('vdocs-attachments-changed', () => changed.push(true));

    await vi.waitFor(() => expect(el.textContent).toContain('One.pdf'));
    await page.getByRole('button', { name: 'Delete One.pdf' }).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Delete this Attachment?'));
    await page.getByRole('button', { name: 'OK' }).click();

    await vi.waitFor(() => expect(mock.history.delete.some(request => request.url === '/v2/template-documents/doc-1')).toBe(true));
  });

  it('uploads a new document', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate());
    mock.onPost('/v2/template-documents').reply(200, makeDocument({ id: 'doc-new' }));
    const el = await render('vdocs-template-attachments', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('Attach a New Document'));

    const file = new File([ 'x' ], 'New.pdf', { type: 'application/pdf' });
    el.querySelector('vdocs-file-chooser')!.dispatchEvent(new CustomEvent('vdocs-select-files', { detail: { files: [ file ] }, bubbles: true, composed: true }));

    await vi.waitFor(() => expect(mock.history.post.some(request => request.url === '/v2/template-documents')).toBe(true));
  });
});

describe('vdocs-template-field-properties', () => {
  it('loads the field into the form', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [ makeField({ name: 'FullName' }) ] }));
    const el = await render('vdocs-template-field-properties', { templateId: TEMPLATE_ID, fieldName: 'FullName' });
    await vi.waitFor(() => expect(el.textContent).toContain('Textbox Settings'));
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('FullName');
  });

  it('shows the options grid for dropdown fields', async () => {
    const field = makeField({ name: 'Choice', type: 'dropdown', options: [ { id: 'a', label: 'Alpha' } ] as ITemplateField['options'] });
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [ field ] }));
    const el = await render('vdocs-template-field-properties', { templateId: TEMPLATE_ID, fieldName: 'Choice' });
    await vi.waitFor(() => expect(el.textContent).toContain('Dropdown Settings'));
    expect(el.textContent).toContain('ID');
    expect(el.querySelector<HTMLInputElement>('input[placeholder="Unique ID"]')!.value).toBe('a');
  });

  it('saves changes and fires vdocs-field-settings-changed', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [ makeField({ name: 'FullName' }) ] }));
    mock.onPatch(new RegExp(`/v2/fields/${TEMPLATE_ID}/`)).reply(200, makeField({ name: 'FullName', label: 'Your name' }));
    const changed: Array<{ fieldName: string }> = [];
    const el = await render('vdocs-template-field-properties', { templateId: TEMPLATE_ID, fieldName: 'FullName' });
    el.addEventListener('vdocs-field-settings-changed', e => changed.push((e as CustomEvent<{ fieldName: string }>).detail));

    await vi.waitFor(() => expect(el.textContent).toContain('Textbox Settings'));
    const labelInput = Array.from(el.querySelectorAll<HTMLInputElement>('input[type="text"]'))[1]!;
    setValue(labelInput, 'Your name');
    await page.getByRole('button', { name: 'Save' }).click();

    await vi.waitFor(() => expect(changed).toHaveLength(1));
    expect(mock.history.patch.some(request => request.url === `/v2/fields/${TEMPLATE_ID}/FullName`)).toBe(true);
  });

  it('deletes the field and fires vdocs-field-deleted', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [ makeField({ name: 'FullName' }) ] }));
    mock.onDelete(new RegExp(`/v2/fields/${TEMPLATE_ID}/`)).reply(200, '');
    const deleted: Array<{ fieldName: string }> = [];
    const el = await render('vdocs-template-field-properties', { templateId: TEMPLATE_ID, fieldName: 'FullName' });
    el.addEventListener('vdocs-field-deleted', e => deleted.push((e as CustomEvent<{ fieldName: string }>).detail));

    await vi.waitFor(() => expect(el.textContent).toContain('Textbox Settings'));
    await page.getByRole('button', { name: 'Delete field' }).click();

    await vi.waitFor(() => expect(deleted).toHaveLength(1));
    expect(deleted[0]?.fieldName).toBe('FullName');
  });
});

describe('vdocs-template-fields', () => {
  it('renders the document pages with placed fields', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [ makeField({ name: 'Signature1' }) ] }));
    mock.onGet(new RegExp('/v2/template-documents/page-image/')).reply(200, 'https://img/p1.png');
    const el = await render('vdocs-template-fields', { templateId: TEMPLATE_ID });

    await vi.waitFor(() => expect(el.querySelector('[aria-label="Signature1 settings"]')).not.toBeNull());
    expect(el.querySelector('vdocs-template-document-page')).not.toBeNull();
  });

  it('shows the empty state when the template has no documents', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ documents: [] }));
    const el = await render('vdocs-template-fields', { templateId: TEMPLATE_ID });
    await vi.waitFor(() => expect(el.textContent).toContain('does not have any documents yet'));
  });

  it('fetches the server-rendered page image', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [] }));
    mock.onGet(new RegExp('/v2/template-documents/page-image/')).reply(200, 'https://img/p1.png');
    const el = await render('vdocs-template-fields', { templateId: TEMPLATE_ID });

    await vi.waitFor(() => expect(el.querySelector('img')?.getAttribute('src')).toBe('https://img/p1.png'));
  });

  it('opens the field properties panel when a placed field is clicked', async () => {
    mock.onGet(`/v2/templates/${TEMPLATE_ID}`).reply(200, makeTemplate({ roles: [ makeRole() ], fields: [ makeField({ name: 'Signature1' }) ] }));
    mock.onGet(new RegExp('/v2/template-documents/page-image/')).reply(200, 'https://img/p1.png');
    const el = await render('vdocs-template-fields', { templateId: TEMPLATE_ID });

    await vi.waitFor(() => expect(el.querySelector('[aria-label="Signature1 settings"]')).not.toBeNull());
    el.querySelector<HTMLElement>('[aria-label="Signature1 settings"]')!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Textbox Settings'));
  });
});
