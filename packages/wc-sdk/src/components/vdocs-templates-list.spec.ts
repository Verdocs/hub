import axios from 'axios';
import { page } from 'vitest/browser';
import MockAdapter from 'axios-mock-adapter';
import type { ITemplate } from '@verdocs/js-sdk';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { invalidateTemplateLists } from '../store/templates.js';
import { mount, TEST_API_BASE } from '../test/helpers.js';
import type { ITemplateEvent } from '../types.js';
import './vdocs-templates-list.js';

const makeTemplate = (overrides: Partial<ITemplate>): ITemplate =>
  ({
    id: 'template-1',
    name: 'Test Template',
    counter: 3,
    star_counter: 0,
    is_personal: false,
    is_public: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    last_used_at: '2026-03-01T00:00:00Z',
    ...overrides,
  }) as ITemplate;

const templates = [
  makeTemplate({ id: 't-1', name: 'Onboarding Packet' }),
  makeTemplate({ id: 't-2', name: 'Sales Agreement' }),
];

describe('vdocs-templates-list', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    // The templates store is module-level and caches by params; drop it so
    // every test observes its own requests.
    invalidateTemplateLists();

    // Under NodeNext resolution the spec sees axios's ESM types and the adapter's CJS types see the CJS
    // ones, and the Axios class has private members, so the two AxiosInstance declarations do not unify.
    mock = new MockAdapter(axios as unknown as ConstructorParameters<typeof MockAdapter>[0]);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/templates').reply(200, { count: 2, rows: 2, page: 0, templates });

    new VerdocsEndpoint({ baseURL: TEST_API_BASE }).setDefault();
  });

  afterEach(() => {
    mock.restore();
    document.body.replaceChildren();
  });

  const renderList = async () => {
    const el = await mount(document.createElement('vdocs-templates-list'));
    await vi.waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/templates')).toBe(true);
    });
    return el;
  };

  it('renders a row per template with the expected query params', async () => {
    const el = await renderList();

    await vi.waitFor(() => {
      expect(el.textContent).toContain('Onboarding Packet');
      expect(el.textContent).toContain('Sales Agreement');
    });

    const listRequest = mock.history.get.find(request => request.url === '/v2/templates');
    expect(listRequest?.params).toEqual(
      expect.objectContaining({ visibility: 'private_shared', sort_by: 'updated_at', page: 0, rows: 10 }),
    );
  });

  it('offers Sign Now as a disabled menu item, omits Delete, and has no star column', async () => {
    const el = await renderList();
    await vi.waitFor(() => {
      expect(el.textContent).toContain('Onboarding Packet');
    });

    // Star features are frozen; the column was deliberately not ported.
    expect(el.querySelector('button[aria-label="Star template"]')).toBeNull();

    const menuButton = el.querySelector<HTMLButtonElement>('button[aria-label="Open menu"]')!;
    menuButton.click();

    await vi.waitFor(() => {
      expect(el.querySelectorAll('[role="menuitem"]').length).toBeGreaterThan(0);
    });

    const labels = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).map(item => item.textContent?.trim());
    expect(labels).toContain('Sign Now');
    expect(labels).not.toContain('Delete');

    const signNow = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find(item => item.textContent?.includes('Sign Now'));
    expect(signNow?.disabled).toBe(true);
  });

  it('fires vdocs-view-template when a row is clicked', async () => {
    const events: ITemplateEvent[] = [];
    const el = await renderList();
    el.addEventListener('vdocs-view-template', e => events.push(e.detail));

    await vi.waitFor(() => {
      expect(el.textContent).toContain('Onboarding Packet');
    });

    await page.getByText('Onboarding Packet').click();
    expect(events.map(event => event.template.id)).toEqual([ 't-1' ]);
  });

  it('re-queries and fires vdocs-change-visibility when the filter changes', async () => {
    const changes: string[] = [];
    const el = await renderList();
    el.addEventListener('vdocs-change-visibility', e => changes.push(e.detail));

    await page.getByRole('button', { name: /Visibility/ }).click();
    await page.getByRole('option', { name: 'Personal', exact: true }).click();

    expect(changes).toEqual([ 'private' ]);
    await vi.waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/templates' && request.params?.visibility === 'private')).toBe(true);
    });
  });

  it('pages through results', async () => {
    mock.onGet('/v2/templates').reply(200, { count: 25, rows: 10, page: 0, templates });

    const el = await renderList();
    await vi.waitFor(() => {
      expect(el.querySelector('nav[aria-label="Pagination"]')).not.toBeNull();
    });

    await page.getByRole('button', { name: 'Page 2' }).click();

    await vi.waitFor(() => {
      expect(mock.history.get.some(request => request.url === '/v2/templates' && request.params?.page === 1)).toBe(true);
    });
  });

  it('shows the empty state when no templates match', async () => {
    mock.onGet('/v2/templates').reply(200, { count: 0, rows: 0, page: 0, templates: [] });

    const el = await renderList();

    await vi.waitFor(() => {
      expect(el.textContent).toContain('No matching templates found');
    });
  });
});
