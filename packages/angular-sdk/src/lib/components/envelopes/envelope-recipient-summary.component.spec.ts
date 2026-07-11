import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsEnvelopeRecipientSummaryComponent } from './envelope-recipient-summary.component';
import type { IEnvelopeEvent } from './envelopes-list.component';
import { provideVerdocs } from '../../provide-verdocs';

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

// Signer 2 is listed first to prove the display sort, and is already
// submitted so only Signer 1 still has an action (and thus a link button).
const envelope = {
  id: 'envelope-1',
  name: 'Offer Letter',
  status: 'pending',
  recipients: [
    makeRecipient({ role_name: 'Signer 2', first_name: 'Rita', last_name: 'Booke', email: 'rita.booke@example.com', sequence: 2, status: 'submitted' }),
    makeRecipient({}),
  ],
} as unknown as IEnvelope;

async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsEnvelopeRecipientSummaryComponent', () => {
  @Component({
    imports: [ VerdocsEnvelopeRecipientSummaryComponent ],
    template: `
      <verdocs-envelope-recipient-summary
        envelopeId="envelope-1"
        [canSendAnother]="canSendAnother()"
        [canView]="canView()"
        [canDone]="canDone()"
        (another)="anothers.push($event)"
        (view)="views.push($event)"
        (done)="dones.push($event)" />
    `,
  })
  class HostComponent {
    canSendAnother = signal(true);
    canView = signal(true);
    canDone = signal(true);
    anothers: IEnvelopeEvent[] = [];
    views: IEnvelopeEvent[] = [];
    dones: IEnvelopeEvent[] = [];
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes/envelope-1').reply(200, envelope);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: 'https://stage-api.verdocs.com' }) ],
    });
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

  const buttonByLabel = (fixture: ComponentFixture<HostComponent>, label: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  it('renders each recipient with its status, sorted by sequence', async () => {
    const fixture = await render();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Recipient Summary');
    expect(text).toContain('Paige Turner (paige.turner@example.com)');
    expect(text).toContain('Rita Booke (rita.booke@example.com)');
    expect(text).toContain('invited');
    expect(text).toContain('submitted');

    // Signer 1 has the lower sequence, so it renders first despite being
    // listed second in the response.
    expect(text.indexOf('Signer 1')).toBeLessThan(text.indexOf('Signer 2'));
  });

  it('fetches, displays, and copies an in-person link for the active recipient', async () => {
    mock.onPost('/v2/sign/in-person/envelope-1/Signer%201').reply(200, { link: 'https://sign.fake.test/abc' });

    const fixture = await render();

    // Only the first recipient in sequence can act, so there is one button.
    const getLink = buttonByLabel(fixture, 'Get Link');
    expect(getLink).toBeTruthy();

    getLink.click();
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('https://sign.fake.test/abc');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://sign.fake.test/abc');
    expect(buttonByLabel(fixture, 'Get Link')).toBeUndefined();
  });

  it('fires the workflow outputs with the envelope', async () => {
    const fixture = await render();

    buttonByLabel(fixture, 'Send Another').click();
    buttonByLabel(fixture, 'View Now').click();
    buttonByLabel(fixture, 'Done').click();

    expect(fixture.componentInstance.anothers).toEqual([ expect.objectContaining({ envelope }) ]);
    expect(fixture.componentInstance.views).toEqual([ expect.objectContaining({ envelope }) ]);
    expect(fixture.componentInstance.dones).toEqual([ expect.objectContaining({ envelope }) ]);
  });

  it('hides workflow buttons that are disabled by inputs', async () => {
    const fixture = await render();
    fixture.componentInstance.canSendAnother.set(false);
    fixture.componentInstance.canView.set(false);
    fixture.detectChanges();

    expect(buttonByLabel(fixture, 'Send Another')).toBeUndefined();
    expect(buttonByLabel(fixture, 'View Now')).toBeUndefined();
    expect(buttonByLabel(fixture, 'Done')).toBeTruthy();
  });
});
