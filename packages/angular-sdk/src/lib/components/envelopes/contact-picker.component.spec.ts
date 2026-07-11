import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { TRecipientAuthMethod } from '@verdocs/js-sdk';
import { VerdocsContactPickerComponent, type IContactSelectEvent, type TPickerContact } from './contact-picker.component';

describe('VerdocsContactPickerComponent', () => {
  @Component({
    imports: [ VerdocsContactPickerComponent ],
    template: `
      <verdocs-contact-picker
        [suggestions]="suggestions()"
        [availableAuthMethods]="availableAuthMethods()"
        (searchContacts)="searches.push($event)"
        (submit)="submitted.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    suggestions = signal<TPickerContact[]>([]);
    availableAuthMethods = signal<TRecipientAuthMethod[]>([ 'passcode', 'email' ]);
    searches: string[] = [];
    submitted: IContactSelectEvent[] = [];
    cancels = 0;
  }

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  const input = (fixture: { nativeElement: HTMLElement }, placeholder: string) =>
    fixture.nativeElement.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement;

  const type = (element: HTMLInputElement, value: string) => {
    element.value = value;
    element.dispatchEvent(new Event('input'));
  };

  const buttonByLabel = (fixture: { nativeElement: HTMLElement }, label: string) =>
    Array.from(fixture.nativeElement.querySelectorAll<HTMLButtonElement>('verdocs-button button')).find(
      button => button.textContent?.trim() === label) as HTMLButtonElement;

  const fillBasics = (fixture: ReturnType<typeof render>) => {
    type(input(fixture, 'First...'), 'Paige');
    type(input(fixture, 'Last...'), 'Turner');
    type(input(fixture, 'Invite/verify via email...'), 'paige.turner@example.com');
    fixture.detectChanges();
  };

  it('requires a name and a valid email before enabling OK, then submits the details', () => {
    const fixture = render();
    expect(buttonByLabel(fixture, 'OK').disabled).toBe(true);

    type(input(fixture, 'First...'), 'Paige');
    type(input(fixture, 'Last...'), 'Turner');
    type(input(fixture, 'Invite/verify via email...'), 'not-an-email');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'OK').disabled).toBe(true);

    type(input(fixture, 'Invite/verify via email...'), 'paige.turner@example.com');
    fixture.detectChanges();
    expect(buttonByLabel(fixture, 'OK').disabled).toBe(false);

    buttonByLabel(fixture, 'OK').click();
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

  it('reports name-field text through searchContacts', () => {
    const fixture = render();

    type(input(fixture, 'First...'), 'Pa');
    type(input(fixture, 'Last...'), 'Tu');

    expect(fixture.componentInstance.searches).toEqual([ 'Pa', 'Tu' ]);
  });

  it('shows matching suggestions on focus and fills the form on selection', async () => {
    const fixture = render();
    fixture.componentInstance.suggestions.set([
      { id: 's-1', first_name: 'Paige', last_name: 'Turner', email: 'paige.turner@example.com', phone: '+15555550123' },
      { id: 's-2', first_name: 'Rita', last_name: 'Booke', email: 'rita.booke@example.com' },
    ]);
    fixture.detectChanges();

    type(input(fixture, 'First...'), 'Pai');
    fixture.detectChanges();
    await fixture.whenStable();

    // Suggestions render through the portal into document.body, filtered by
    // the first-name text.
    const options = Array.from(document.querySelectorAll('.vdocs-portal button'));
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain('Paige Turner');

    (options[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(input(fixture, 'First...').value).toBe('Paige');
    expect(input(fixture, 'Last...').value).toBe('Turner');
    expect(input(fixture, 'Invite/verify via email...').value).toBe('paige.turner@example.com');
    expect(document.querySelector('.vdocs-portal button')).toBeNull();
  });

  it('formats the phone number to E.164 and hides the phone row unless SMS is available', () => {
    const fixture = render();
    expect(input(fixture, 'Invite/verify via SMS...')).toBeNull();

    fixture.componentInstance.availableAuthMethods.set([ 'passcode', 'email', 'sms' ]);
    fixture.detectChanges();

    type(input(fixture, 'Invite/verify via SMS...'), '(212) 555-1212');
    fixture.detectChanges();

    expect(input(fixture, 'Invite/verify via SMS...').value).toBe('+12125551212');
  });

  it('requires a passcode once passcode verification is selected', () => {
    const fixture = render();
    fillBasics(fixture);

    const passcodeCheckbox = Array.from(fixture.nativeElement.querySelectorAll('verdocs-checkbox label') as NodeListOf<HTMLLabelElement>).find(
      label => label.textContent?.includes('Passcode'))?.querySelector('input') as HTMLInputElement;
    passcodeCheckbox.click();
    fixture.detectChanges();

    expect(buttonByLabel(fixture, 'OK').disabled).toBe(true);

    type(input(fixture, '4-8 digits recommended...'), '1234');
    fixture.detectChanges();

    expect(buttonByLabel(fixture, 'OK').disabled).toBe(false);

    buttonByLabel(fixture, 'OK').click();
    expect(fixture.componentInstance.submitted[0]).toEqual(
      expect.objectContaining({ auth_methods: [ 'passcode' ], passcode: '1234' }),
    );
  });

  it('treats delegator and name-locked as mutually exclusive', () => {
    const fixture = render();

    const checkbox = (label: string) =>
      Array.from(fixture.nativeElement.querySelectorAll('verdocs-checkbox label') as NodeListOf<HTMLLabelElement>).find(
        element => element.textContent?.includes(label))?.querySelector('input') as HTMLInputElement;

    checkbox('May delegate signing').click();
    fixture.detectChanges();
    expect(checkbox('Name locked').disabled).toBe(true);

    checkbox('May delegate signing').click();
    fixture.detectChanges();
    checkbox('Name locked').click();
    fixture.detectChanges();
    expect(checkbox('May delegate signing').disabled).toBe(true);
  });

  it('fires cancel when the user cancels', () => {
    const fixture = render();

    buttonByLabel(fixture, 'Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
