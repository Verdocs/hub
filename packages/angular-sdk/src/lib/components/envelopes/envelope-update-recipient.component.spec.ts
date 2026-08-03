import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Component, signal } from '@angular/core';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { VerdocsEnvelopeUpdateRecipientComponent } from './envelope-update-recipient.component';
import { provideVerdocs } from '../../provide-verdocs';
import { TEST_API_BASE } from '../../session';
import type { SDKError } from '../../types';

const recipient = {
  envelope_id: 'envelope-1',
  role_name: 'Signer 1',
  first_name: 'Paige',
  last_name: 'Turner',
  email: 'paige.turner@example.com',
  phone: '',
  message: '',
  sequence: 1,
  order: 1,
  status: 'invited',
} as unknown as IRecipient;

const envelope = {
  id: 'envelope-1',
  name: 'Offer Letter',
  status: 'pending',
  recipients: [ recipient ],
} as unknown as IEnvelope;

// Mutations chain promises the pending-task tracker cannot see, so settle the
// tracker and the microtask queue a few times before asserting.
async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 5; i++) {
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

describe('VerdocsEnvelopeUpdateRecipientComponent', () => {
  @Component({
    imports: [ VerdocsEnvelopeUpdateRecipientComponent ],
    template: `
      <verdocs-envelope-update-recipient
        [envelopeId]="envelopeId()"
        roleName="Signer 1"
        (updated)="updates.push($event)"
        (cancel)="cancels = cancels + 1"
        (sdkError)="errors.push($event)" />
    `,
  })
  class HostComponent {
    envelopeId = signal('envelope-1');
    updates: IRecipient[] = [];
    errors: SDKError[] = [];
    cancels = 0;
  }

  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();

    mock = new MockAdapter(axios);
    mock.onGet('/v2/envelopes/envelope-1').reply(200, envelope);

    TestBed.configureTestingModule({
      providers: [ provideVerdocs({ baseUrl: TEST_API_BASE }) ],
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

  // The dialog moves itself to document.body, so query the document.
  const inputByPlaceholder = (placeholder: string) =>
    document.querySelector(`[role="dialog"] input[placeholder="${placeholder}"]`) as HTMLInputElement;

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  const type = (element: HTMLInputElement, value: string) => {
    element.value = value;
    element.dispatchEvent(new Event('input'));
  };

  it('prefills the form from the loaded recipient', async () => {
    await render();

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Signer 1');
    expect(inputByPlaceholder('First Name...').value).toBe('Paige');
    expect(inputByPlaceholder('Last Name...').value).toBe('Turner');
    expect(inputByPlaceholder('Email Address...').value).toBe('paige.turner@example.com');
  });

  it('submits only the changed fields and fires updated', async () => {
    mock.onPatch('/v2/envelopes/envelope-1/recipients/Signer%201').reply(200, { ...recipient, first_name: 'Sue' });

    const fixture = await render();

    type(inputByPlaceholder('First Name...'), 'Sue');
    fixture.detectChanges();

    buttonByLabel('Save').click();
    await settle(fixture);

    const request = mock.history.patch[0];
    expect(JSON.parse(request?.data as string)).toEqual({ first_name: 'Sue' });

    expect(fixture.componentInstance.updates).toEqual([ expect.objectContaining({ first_name: 'Sue' }) ]);

    // The save also refreshes the envelope detail query, React's
    // invalidateQueries(['envelopes', envelopeId]).
    expect(mock.history.get.filter(r => r.url === '/v2/envelopes/envelope-1').length).toBeGreaterThan(1);
  });

  it('fires cancel without a request when nothing changed', async () => {
    const fixture = await render();

    buttonByLabel('Save').click();
    await settle(fixture);

    expect(mock.history.patch).toEqual([]);
    expect(fixture.componentInstance.cancels).toBe(1);
  });

  it('fires cancel from the Cancel button', async () => {
    const fixture = await render();

    buttonByLabel('Cancel').click();

    expect(fixture.componentInstance.cancels).toBe(1);
    expect(mock.history.patch).toEqual([]);
  });
});
