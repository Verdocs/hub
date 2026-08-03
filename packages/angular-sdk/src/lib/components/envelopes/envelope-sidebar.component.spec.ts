import axios from 'axios';
import { Component } from '@angular/core';
import MockAdapter from 'axios-mock-adapter';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsEnvelopeSidebarComponent, type IEnvelopeRecipientEvent, type IEnvelopeUpdatedEvent } from './envelope-sidebar.component';
import { provideVerdocs, VERDOCS_ENDPOINT } from '../../provide-verdocs';
import { makeTestJwt } from '../../test-support';
import { TEST_API_BASE } from '../../session';

const makeRecipient = (overrides: Partial<IRecipient>): IRecipient =>
  ({
    envelope_id: 'envelope-1',
    role_name: 'Signer 1',
    first_name: 'Paige',
    last_name: 'Turner',
    email: 'paige.turner@example.com',
    sequence: 1,
    order: 1,
    status: 'invited',
    ...overrides,
  }) as IRecipient;

const envelope = {
  id: 'envelope-1',
  name: 'Offer Letter',
  status: 'in progress',
  profile_id: 'profile-1',
  profile: { id: 'profile-1', first_name: 'Olive', last_name: 'Branch', email: 'olive.branch@example.com' },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  initial_reminder: null,
  followup_reminders: null,
  next_reminder: null,
  recipients: [ makeRecipient({}) ],
  history_entries: [
    { id: 'h-1', envelope_id: 'envelope-1', role_name: 'Signer 1', event: 'recipient:invited', event_detail: 'mail', created_at: '2026-01-01T01:00:00Z' },
    { id: 'h-2', envelope_id: 'envelope-1', role_name: 'Signer 1', event: 'recipient:opened', event_detail: 'email', created_at: '2026-01-02T01:00:00Z' },
  ],
} as unknown as IEnvelope;

async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsEnvelopeSidebarComponent', () => {
  @Component({
    imports: [ VerdocsEnvelopeSidebarComponent ],
    template: `
      <verdocs-envelope-sidebar
        envelopeId="envelope-1"
        (toggle)="toggles.push($event)"
        (envelopeUpdated)="updates.push($event)"
        (getInPersonLink)="linkRequests.push($event)" />
    `,
  })
  class HostComponent {
    toggles: boolean[] = [];
    updates: IEnvelopeUpdatedEvent[] = [];
    linkRequests: IEnvelopeRecipientEvent[] = [];
  }

  let mock: MockAdapter;
  // The detail GET is stateful so a mutation that refreshes the envelope (the
  // service re-fetches and primes) sees the updated record, matching how beta
  // behaves after a PATCH.
  let detailState: IEnvelope;

  beforeEach(() => {
    localStorage.clear();
    detailState = envelope;

    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes/envelope-1').reply(() => [ 200, detailState ]);
    // The signed-in user is the envelope owner, which unlocks the recipient
    // menus, reminders, and Cancel Envelope.
    mock.onGet('/v2/profiles').reply(200, [ { id: 'profile-1', current: true } ]);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: TEST_API_BASE }) ],
    });
    TestBed.inject(VERDOCS_ENDPOINT).setToken(makeTestJwt());
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

  const tabByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    element(fixture).querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;

  const openTab = async (fixture: ComponentFixture<HostComponent>, label: string) => {
    tabByLabel(fixture, label).click();
    await settle(fixture);
  };

  const menuItemByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find(
      item => item.textContent?.trim() === label) as HTMLButtonElement;

  it('opens the Details tab and reports the toggle', async () => {
    const fixture = await render();

    expect(element(fixture).querySelector('[role="tabpanel"]')).toBeNull();

    await openTab(fixture, 'Details');

    const text = element(fixture).querySelector('[role="tabpanel"]')?.textContent;
    expect(text).toContain('Envelope ID');
    expect(text).toContain('envelope-1');
    expect(text).toContain('Olive Branch');
    expect(fixture.componentInstance.toggles).toEqual([ true ]);

    // Clicking the active tab again collapses the panel.
    await openTab(fixture, 'Details');
    expect(element(fixture).querySelector('[role="tabpanel"]')).toBeNull();
    expect(fixture.componentInstance.toggles).toEqual([ true, false ]);
  });

  it('renders recipients with statuses and sends reminders from the row menu', async () => {
    mock.onPatch('/v2/envelopes/envelope-1/recipients/Signer%201').reply(200, { status: 'OK' });

    const fixture = await render();
    await openTab(fixture, 'Recipients');

    const panelText = element(fixture).querySelector('[role="tabpanel"]')?.textContent;
    expect(panelText).toContain('Signer 1');
    expect(panelText).toContain('Paige Turner');
    expect(panelText).toContain('invited');

    (element(fixture).querySelector('button[aria-label="Open menu"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    menuItemByLabel(fixture, 'Send Reminder').click();
    await settle(fixture);

    const request = mock.history.patch[0];
    expect(request?.url).toBe('/v2/envelopes/envelope-1/recipients/Signer%201');
    expect(JSON.parse(request?.data as string)).toEqual({ action: 'remind' });
    expect(fixture.componentInstance.updates).toEqual([ expect.objectContaining({ event: 'reminder' }) ]);
  });

  it('hands the in-person link action to the host', async () => {
    const fixture = await render();
    await openTab(fixture, 'Recipients');

    (element(fixture).querySelector('button[aria-label="Open menu"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    menuItemByLabel(fixture, 'Get In-Person Link').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.linkRequests).toEqual([
      expect.objectContaining({ recipient: expect.objectContaining({ role_name: 'Signer 1' }) }),
    ]);
  });

  it('renders the history timeline, newest first', async () => {
    const fixture = await render();
    await openTab(fixture, 'History');

    const panelText = element(fixture).querySelector('[role="tabpanel"]')?.textContent ?? '';
    expect(panelText).toContain('Envelope created.');
    expect(panelText).toContain('Paige Turner has been invited via email.');
    expect(panelText).toContain('Opened by Paige Turner, via email.');
    expect(panelText.indexOf('Opened by')).toBeLessThan(panelText.indexOf('has been invited'));
    expect(element(fixture).querySelectorAll('verdocs-envelope-history-icon svg').length).toBe(3);
  });

  it('cancels the envelope after confirmation', async () => {
    mock.onPut('/v2/envelopes/envelope-1').reply(200, { ...envelope, status: 'canceled' });

    const fixture = await render();
    await openTab(fixture, 'Recipients');

    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button'))
      .find(button => button.textContent?.trim() === 'Cancel Envelope')
      ?.click();
    await settle(fixture);

    // The confirm dialog renders in document.body; OK proceeds.
    const okButton = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
      button => button.textContent?.trim() === 'OK') as HTMLButtonElement;
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Cancel Envelope?');
    okButton.click();
    await settle(fixture);

    const request = mock.history.put[0];
    expect(request?.url).toBe('/v2/envelopes/envelope-1');
    expect(JSON.parse(request?.data as string)).toEqual({ action: 'cancel' });
    expect(fixture.componentInstance.updates).toEqual([
      expect.objectContaining({ event: 'canceled', envelope: expect.objectContaining({ status: 'canceled' }) }),
    ]);
  });

  it('enables reminders with the default schedule', async () => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const enabled = { ...envelope, initial_reminder: MS_PER_DAY, followup_reminders: 3 * MS_PER_DAY };
    mock.onPatch('/v2/envelopes/envelope-1').reply(() => {
      // The service re-fetches the detail after the PATCH, so reflect the new
      // reminder schedule in what the GET returns next.
      detailState = enabled as IEnvelope;
      return [ 200, enabled ];
    });

    const fixture = await render();
    await openTab(fixture, 'Recipients');

    (element(fixture).querySelector('input[role="switch"]') as HTMLInputElement).click();
    await settle(fixture);

    const request = mock.history.patch.find(r => r.url === '/v2/envelopes/envelope-1');
    expect(JSON.parse(request?.data as string)).toEqual({ initial_reminder: MS_PER_DAY, followup_reminders: 3 * MS_PER_DAY });

    // The refreshed envelope drives the panel, so the day fields appear.
    const panelText = element(fixture).querySelector('[role="tabpanel"]')?.textContent;
    expect(panelText).toContain('Initial Reminder (days):');
  });
});
