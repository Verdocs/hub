import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IRecipient, TRecipientAuthMethod } from '@verdocs/js-sdk';
import { VerdocsContactPickerComponent, type IContactSelectEvent, type TPickerContact } from './contact-picker.component';

describe('VerdocsContactPickerComponent', () => {
  @Component({
    imports: [ VerdocsContactPickerComponent ],
    template: `
      <verdocs-contact-picker
        [templateRole]="templateRole()"
        [suggestions]="suggestions()"
        [availableAuthMethods]="availableAuthMethods()"
        [showCancel]="showCancel()"
        (searchContacts)="searches.push($event)"
        (submit)="submitted.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    templateRole = signal<Partial<IRecipient> | null>(null);
    suggestions = signal<TPickerContact[]>([]);
    availableAuthMethods = signal<TRecipientAuthMethod[]>([ 'passcode', 'email' ]);
    showCancel = signal(true);
    searches: string[] = [];
    submitted: IContactSelectEvent[] = [];
    cancels = 0;
  }

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  type TFixture = ReturnType<typeof render>;

  const element = (fixture: TFixture) => fixture.nativeElement as HTMLElement;

  // Field ids carry a per-instance prefix (autofill defense), so specs match on the suffix.
  const field = (fixture: TFixture, name: string) =>
    element(fixture).querySelector(`[id$="-${name}"]`) as HTMLInputElement | HTMLTextAreaElement;

  const passcodeField = (fixture: TFixture) => element(fixture).querySelector('input[aria-label="Passcode"]') as HTMLInputElement;

  const type = (target: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    target.value = value;
    target.dispatchEvent(new Event('input'));
  };

  const buttonByLabel = (fixture: TFixture, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  const pillByLabel = (fixture: TFixture, label: string) =>
    Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('button[aria-pressed]')).find(
      pill => pill.textContent?.trim() === label) as HTMLButtonElement;

  const fillBasics = (fixture: TFixture) => {
    type(field(fixture, 'first-name'), 'Paige');
    type(field(fixture, 'last-name'), 'Turner');
    type(field(fixture, 'email'), 'paige.turner@example.com');
    fixture.detectChanges();
  };

  it('requires a name and a valid email before enabling Done, then submits the details', () => {
    const fixture = render();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(true);

    type(field(fixture, 'first-name'), 'Paige');
    type(field(fixture, 'last-name'), 'Turner');
    type(field(fixture, 'email'), 'not-an-email');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(true);

    type(field(fixture, 'email'), 'paige.turner@example.com');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(false);

    buttonByLabel(fixture, 'Done').click();
    expect(fixture.componentInstance.submitted).toEqual([
      {
        first_name: 'Paige',
        last_name: 'Turner',
        email: 'paige.turner@example.com',
        phone: '',
        message: '',
        delegator: false,
        name_locked: false,
        auth_methods: [],
        passcode: '',
      },
    ]);
  });

  it('labels the stacked fields and hides the phone field unless SMS is available', () => {
    const fixture = render();
    const labels = Array.from(element(fixture).querySelectorAll('label')).map(label => label.textContent?.replace(/\s+/g, ' ').trim());

    expect(labels).toEqual([ 'First name', 'Last name', 'Email', 'Message (optional)' ]);

    fixture.componentInstance.availableAuthMethods.set([ 'passcode', 'email', 'sms' ]);
    fixture.detectChanges();

    expect(Array.from(element(fixture).querySelectorAll('label')).map(label => label.textContent?.replace(/\s+/g, ' ').trim())).toContain(
      'Phone (optional)');
  });

  it('reports name-field text through searchContacts', () => {
    const fixture = render();

    type(field(fixture, 'first-name'), 'Pa');
    type(field(fixture, 'last-name'), 'Tu');

    expect(fixture.componentInstance.searches).toEqual([ 'Pa', 'Tu' ]);
  });

  it('renders suggestions inside the picker, fills the form on selection, and closes on an outside click', async () => {
    const fixture = render();
    fixture.componentInstance.suggestions.set([
      { id: 's-1', first_name: 'Paige', last_name: 'Turner', email: 'paige.turner@example.com', phone: '+15555550123' },
      { id: 's-2', first_name: 'Rita', last_name: 'Booke', email: 'rita.booke@example.com' },
    ]);
    fixture.detectChanges();

    type(field(fixture, 'first-name'), 'Pai');
    fixture.detectChanges();
    await fixture.whenStable();

    // The list lives in the picker's own DOM (no portal) and is filtered by the first-name text.
    expect(document.querySelector('.vdocs-portal')).toBeNull();
    const options = Array.from(element(fixture).querySelectorAll('div[class*="z-20"] button'));
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain('Paige Turner');

    (options[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(field(fixture, 'first-name').value).toBe('Paige');
    expect(field(fixture, 'last-name').value).toBe('Turner');
    expect(field(fixture, 'email').value).toBe('paige.turner@example.com');

    field(fixture, 'first-name').dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(element(fixture).querySelectorAll('div[class*="z-20"] button').length).toBe(1);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(element(fixture).querySelectorAll('div[class*="z-20"] button').length).toBe(0);
  });

  it('formats the phone number to E.164', () => {
    const fixture = render();
    fixture.componentInstance.availableAuthMethods.set([ 'passcode', 'email', 'sms' ]);
    fixture.detectChanges();

    type(field(fixture, 'phone'), '(212) 555-1212');
    fixture.detectChanges();

    expect(field(fixture, 'phone').value).toBe('+12125551212');
  });

  it('shows the passcode field with its hint and requires a code once Passcode is selected', () => {
    const fixture = render();
    fillBasics(fixture);
    expect(passcodeField(fixture)).toBeNull();

    pillByLabel(fixture, 'Passcode').click();
    fixture.detectChanges();

    expect(buttonByLabel(fixture, 'Done').disabled).toBe(true);
    expect(element(fixture).textContent).toContain('PIN or passcode already known by the recipient');

    type(passcodeField(fixture), '1234');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(false);

    buttonByLabel(fixture, 'Done').click();
    expect(fixture.componentInstance.submitted[0]).toEqual(
      expect.objectContaining({ auth_methods: [ 'passcode' ], passcode: '1234' }),
    );
  });

  it('holds Done until every selected verification method is satisfied', () => {
    const fixture = render();
    fixture.componentInstance.availableAuthMethods.set([ 'passcode', 'email', 'sms' ]);
    fixture.detectChanges();
    fillBasics(fixture);

    // Email is satisfied by the address already entered, so an OR rule would let this through.
    pillByLabel(fixture, 'Email').click();
    pillByLabel(fixture, 'Passcode').click();
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(true);

    type(passcodeField(fixture), '4321');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(false);

    // SMS needs a phone of its own, satisfied email and passcode notwithstanding.
    pillByLabel(fixture, 'SMS code').click();
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(true);

    type(field(fixture, 'phone'), '2125551212');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Done').disabled).toBe(false);
  });

  it('locks verification methods the plan does not include, unless they are already selected', () => {
    const fixture = render();

    expect(pillByLabel(fixture, 'KBA').disabled).toBe(true);
    expect(pillByLabel(fixture, 'ID check').disabled).toBe(true);
    expect(pillByLabel(fixture, 'KBA').className).toContain('vdocs:opacity-50');
    expect(pillByLabel(fixture, 'KBA').title).toBe('Not included in your plan');
    expect(pillByLabel(fixture, 'KBA').querySelector('svg')).not.toBeNull();
    expect(pillByLabel(fixture, 'Email').disabled).toBe(false);
    expect(pillByLabel(fixture, 'Email').querySelector('svg')).toBeNull();

    // A method the plan has since dropped stays clickable so the sender can clear it.
    fixture.componentInstance.templateRole.set({ first_name: 'Paige', last_name: 'Turner', email: 'paige.turner@example.com', auth_methods: [ 'kba' ] });
    fixture.detectChanges();

    expect(pillByLabel(fixture, 'KBA').disabled).toBe(false);
    expect(pillByLabel(fixture, 'KBA').getAttribute('aria-pressed')).toBe('true');

    pillByLabel(fixture, 'KBA').click();
    fixture.detectChanges();
    expect(pillByLabel(fixture, 'KBA').getAttribute('aria-pressed')).toBe('false');
    expect(pillByLabel(fixture, 'KBA').disabled).toBe(true);
  });

  it('treats the signing options as one three-way choice', () => {
    const fixture = render();
    fillBasics(fixture);

    expect(pillByLabel(fixture, 'None').getAttribute('aria-pressed')).toBe('true');

    pillByLabel(fixture, 'May delegate').click();
    fixture.detectChanges();
    expect(pillByLabel(fixture, 'None').getAttribute('aria-pressed')).toBe('false');
    expect(pillByLabel(fixture, 'Name locked').getAttribute('aria-pressed')).toBe('false');

    pillByLabel(fixture, 'Name locked').click();
    fixture.detectChanges();
    expect(pillByLabel(fixture, 'May delegate').getAttribute('aria-pressed')).toBe('false');

    buttonByLabel(fixture, 'Done').click();
    expect(fixture.componentInstance.submitted[0]).toEqual(expect.objectContaining({ delegator: false, name_locked: true }));

    pillByLabel(fixture, 'None').click();
    fixture.detectChanges();
    buttonByLabel(fixture, 'Done').click();
    expect(fixture.componentInstance.submitted[1]).toEqual(expect.objectContaining({ delegator: false, name_locked: false }));
  });

  it('fires cancel when the user cancels, and drops the button when showCancel is off', () => {
    const fixture = render();

    buttonByLabel(fixture, 'Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);

    fixture.componentInstance.showCancel.set(false);
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'Cancel')).toBeUndefined();
    expect(buttonByLabel(fixture, 'Done')).not.toBeUndefined();
  });
});
