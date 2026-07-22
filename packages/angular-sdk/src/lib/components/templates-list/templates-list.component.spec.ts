import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TestBed } from '@angular/core/testing';
import type { ITemplate } from '@verdocs/js-sdk';
import { VerdocsTemplatesListComponent } from './templates-list.component';
import { provideVerdocs } from '../../provide-verdocs';

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
  makeTemplate({ id: 't-1', name: 'Onboarding Packet', star_counter: 1 }),
  makeTemplate({ id: 't-2', name: 'Sales Agreement' }),
];

describe('VerdocsTemplatesListComponent', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/profiles').reply(200, []);
    mock.onGet('/v2/templates').reply(200, { count: 2, rows: 2, page: 0, templates });

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
  });

  afterEach(() => {
    mock.restore();
  });

  const renderList = async () => {
    const fixture = TestBed.createComponent(VerdocsTemplatesListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  it('renders a row per template', async () => {
    const fixture = await renderList();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Onboarding Packet');
    expect(text).toContain('Sales Agreement');

    const listRequest = mock.history.get.find(request => request.url === '/v2/templates');
    expect(listRequest?.params).toEqual(
      expect.objectContaining({ visibility: 'private_shared', sort_by: 'updated_at', page: 0, rows: 10 }),
    );
  });

  it('toggles stars through the service', async () => {
    mock.onGet('/v2/templates/t-2/star').reply(200, makeTemplate({ id: 't-2', star_counter: 1 }));

    const fixture = await renderList();

    const starButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Star template"]');
    starButton.click();
    await fixture.whenStable();

    const toggleRequest = mock.history.get.find(request => request.url === '/v2/templates/t-2/star');
    expect(toggleRequest).toBeTruthy();
  });

  it('offers Sign Now as a disabled menu item and omits Delete', async () => {
    const fixture = await renderList();

    const menuButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Open menu"]');
    menuButton.click();
    fixture.detectChanges();

    const items: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('[role="menuitem"]');
    const labels = Array.from(items).map(item => item.textContent?.trim());
    expect(labels).toContain('Sign Now');
    expect(labels).not.toContain('Delete');

    const signNow = Array.from(items).find(item => item.textContent?.includes('Sign Now'));
    expect(signNow?.disabled).toBe(true);
  });

  it('shows the empty state when no templates match', async () => {
    mock.onGet('/v2/templates').reply(200, { count: 0, rows: 0, page: 0, templates: [] });

    const fixture = await renderList();

    expect(fixture.nativeElement.textContent).toContain('No matching templates found');
  });
});
