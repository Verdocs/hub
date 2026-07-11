import axios from 'axios';
import { Component } from '@angular/core';
import MockAdapter from 'axios-mock-adapter';
import type { IEnvelope } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsEnvelopesListComponent, type IEnvelopeEvent } from './envelopes-list.component';
import { provideVerdocs, VERDOCS_ENDPOINT } from '../../provide-verdocs';
import { makeTestJwt } from '../../test-support';

const makeEnvelope = (overrides: Partial<IEnvelope>): IEnvelope =>
  ({
    id: 'envelope-1',
    name: 'Offer Letter',
    status: 'in progress',
    profile_id: 'profile-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    recipients: [ { role_name: 'Signer 1', first_name: 'Paige', last_name: 'Turner', email: 'paige@example.com' } ],
    ...overrides,
  }) as unknown as IEnvelope;

const page = (envelopes: IEnvelope[], count = envelopes.length) => ({ count, rows: 10, page: 0, envelopes });

async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsEnvelopesListComponent', () => {
  @Component({
    imports: [ VerdocsEnvelopesListComponent ],
    template: `
      <verdocs-envelopes-list
        [initialView]="'all'"
        (viewEnvelope)="views.push($event)"
        (download)="downloads.push($event)"
        (cancelEnvelope)="cancels.push($event)" />
    `,
  })
  class HostComponent {
    views: IEnvelopeEvent[] = [];
    downloads: IEnvelopeEvent[] = [];
    cancels: IEnvelopeEvent[] = [];
  }

  let mock: MockAdapter;
  let lastParams: Record<string, unknown> | undefined;

  beforeEach(() => {
    localStorage.clear();
    lastParams = undefined;

    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes').reply(config => {
      lastParams = config.params;
      return [ 200, page([ makeEnvelope({}), makeEnvelope({ id: 'envelope-2', name: 'NDA', status: 'complete' }) ]) ];
    });
    // The signed-in user owns the envelopes, which unlocks Cancel.
    mock.onGet('/v2/profiles').reply(200, [ { id: 'profile-1', current: true } ]);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
    TestBed.inject(VERDOCS_ENDPOINT).setToken(makeTestJwt({ profile_id: 'profile-1' }));
  });

  afterEach(() => {
    mock.restore();
    document.querySelectorAll('.vdocs-toast').forEach(toast => toast.remove());
  });

  const render = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  };

  const element = (fixture: ComponentFixture<HostComponent>) => fixture.nativeElement as HTMLElement;

  const listOf = (fixture: ComponentFixture<HostComponent>) =>
    fixture.debugElement.children[0]!.componentInstance as VerdocsEnvelopesListComponent;

  it('renders a row per envelope with name and recipients', async () => {
    const fixture = await render();
    const text = element(fixture).textContent ?? '';

    expect(text).toContain('Offer Letter');
    expect(text).toContain('NDA');
    expect(text).toContain('Paige Turner');
  });

  it('requests the default all-view status set, sort, and page', async () => {
    await render();

    expect(lastParams?.status).toEqual([ 'pending', 'in progress', 'complete', 'declined', 'canceled' ]);
    expect(lastParams?.sort_by).toBe('created_at');
    expect(lastParams?.page).toBe(0);
    expect(lastParams?.rows).toBe(10);
  });

  it('requeries with a single status when the status filter narrows', async () => {
    const fixture = await render();
    const list = listOf(fixture);

    (list as unknown as { onChangeStatus: (o: { value: string; label: string }) => void }).onChangeStatus({ value: 'declined', label: 'Declined' });
    await settle(fixture);

    expect(lastParams?.status).toEqual([ 'declined' ]);
    expect(lastParams?.page).toBe(0);
  });

  it('requeries with the view param and resets the page on view change', async () => {
    const fixture = await render();
    const list = listOf(fixture);

    (list as unknown as { onChangeView: (o: { value: string; label: string }) => void }).onChangeView({ value: 'inbox', label: 'Inbox' });
    await settle(fixture);

    expect(lastParams?.view).toBe('inbox');
  });

  it('sends the match term as q after a filter commit', async () => {
    const fixture = await render();
    const list = listOf(fixture);

    (list as unknown as { commitMatchFilter: (v: string) => void }).commitMatchFilter('  contract  ');
    await settle(fixture);

    expect(lastParams?.q).toBe('contract');
  });

  it('requeries with the selected page on pagination', async () => {
    const fixture = await render();
    const list = listOf(fixture);

    list['selectedPage'].set(2);
    await settle(fixture);

    expect(lastParams?.page).toBe(2);
  });

  it('emits viewEnvelope when a row is clicked', async () => {
    const fixture = await render();
    const row = Array.from(element(fixture).querySelectorAll('[class*="cursor-pointer"]')).find(
      candidate => candidate.textContent?.includes('Offer Letter')) as HTMLElement;
    row.click();
    await settle(fixture);

    expect(fixture.componentInstance.views).toHaveLength(1);
    expect(fixture.componentInstance.views[0]?.envelope.name).toBe('Offer Letter');
  });

  it('routes row-menu selections to the matching output', async () => {
    const fixture = await render();
    const list = listOf(fixture);
    const envelope = makeEnvelope({});

    (list as unknown as { onMenuSelect: (o: { id: string }, e: IEnvelope) => void }).onMenuSelect({ id: 'download' }, envelope);
    expect(fixture.componentInstance.downloads).toHaveLength(1);

    (list as unknown as { onMenuSelect: (o: { id: string }, e: IEnvelope) => void }).onMenuSelect({ id: 'cancel' }, envelope);
    expect(fixture.componentInstance.cancels).toHaveLength(1);
  });

  it('shows the empty state when no envelopes match', async () => {
    mock.onGet('/v2/envelopes').reply(200, page([]));
    const fixture = await render();

    expect(element(fixture).textContent).toContain('No matching envelopes found');
  });
});
