import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IKBAQuestion } from '@verdocs/js-sdk';
import { VerdocsKbaDialogComponent, type IKbaAnswer, type IKbaIdentityDetails } from './kba-dialog.component';

const QUESTIONS: IKBAQuestion[] = [
  { type: 'q-address', prompt: 'Select your most recent address.', answer: [ '553 Arbor Dr', '18 Lacey Ln', '23A Ball Ct' ] },
  { type: 'q-county', prompt: 'Select the county you have lived in.', answer: [ 'Marion', 'Baldwin', 'None of the above' ] },
];

const FULL_DETAILS: Partial<IKbaIdentityDetails> = {
  first_name: 'Paige',
  last_name: 'Turner',
  address: '123 Main St',
  zip: '62704',
  ssn_last_4: '1234',
  dob: '1990-05-15',
};

describe('VerdocsKbaDialogComponent', () => {
  @Component({
    imports: [ VerdocsKbaDialogComponent ],
    template: `
      <verdocs-kba-dialog
        [mode]="mode()"
        [helpTitle]="helpTitle()"
        [questions]="questions()"
        [initialDetails]="initialDetails()"
        (submitIdentity)="identity = $event"
        (answerQuestion)="answers.push($event)"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    identity: IKbaIdentityDetails | null = null;
    answers: IKbaAnswer[] = [];
    cancels = 0;
    mode = signal<'identity' | 'questions'>('identity');
    helpTitle = signal('');
    questions = signal<IKBAQuestion[]>([]);
    initialDetails = signal<Partial<IKbaIdentityDetails>>({});
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const panel = () => document.querySelector('[role="dialog"]') as HTMLElement;
  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement | undefined;

  function type(placeholder: string, value: string) {
    const input = document.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('renders the identity form with the DOB bounds and no cancel button', async () => {
    await createFixture();

    expect(panel().textContent).toContain('Please Confirm Your Identity');
    expect(document.querySelector('input[placeholder="First name..."]')).not.toBeNull();
    expect(document.querySelector('input[placeholder="Last name..."]')).not.toBeNull();
    expect(document.querySelector('input[placeholder="Address..."]')).not.toBeNull();
    expect(document.querySelector('select')).not.toBeNull();
    expect(document.querySelector('input[type="checkbox"]')).not.toBeNull();

    // The identity provider needs an adult signer, so the DOB input keeps the legacy bounds.
    const dob = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dob.min).toBe('1920-01-01');
    expect(dob.max).toBeTruthy();

    // The legacy identity form offered no cancel button, only the dialog dismiss affordances.
    expect(buttonByLabel('Cancel')).toBeUndefined();
  });

  it('collects the entered details and fires submitIdentity once agreed', async () => {
    const fixture = await createFixture();

    const submit = buttonByLabel('Submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    type('First name...', 'Paige');
    type('Last name...', 'Turner');
    type('Address...', '123 Main St');
    type('City...', 'Springfield');
    type('Zip Code...', '62704');
    type('Last 4 digits of your Social Security Number...', '1234');

    const state = document.querySelector('select') as HTMLSelectElement;
    state.value = 'IL';
    state.dispatchEvent(new Event('change'));

    const dob = document.querySelector('input[type="date"]') as HTMLInputElement;
    dob.value = '1990-05-15';
    dob.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Everything is filled in but the agreement box gates submission.
    expect(submit.disabled).toBe(true);
    (document.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(submit.disabled).toBe(false);

    submit.click();
    expect(fixture.componentInstance.identity).toEqual({
      first_name: 'Paige',
      last_name: 'Turner',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      ssn_last_4: '1234',
      dob: '1990-05-15',
    });
  });

  it('requires everything except city and state', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.initialDetails.set(FULL_DETAILS);
    fixture.detectChanges();

    (document.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();
    expect((buttonByLabel('Submit') as HTMLButtonElement).disabled).toBe(false);

    fixture.componentInstance.initialDetails.set({ ...FULL_DETAILS, ssn_last_4: '' });
    fixture.detectChanges();
    expect((buttonByLabel('Submit') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the help box, choices, and step counter in questions mode', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.mode.set('questions');
    fixture.componentInstance.helpTitle.set('Verify your identity');
    fixture.componentInstance.questions.set(QUESTIONS);
    fixture.detectChanges();

    expect(panel().textContent).toContain('Verify your identity');
    expect(panel().textContent).toContain('Select your most recent address.');
    expect(panel().textContent).toContain('(1/2)');
    expect(buttonByLabel('553 Arbor Dr')).toBeDefined();
    expect((buttonByLabel('Next') as HTMLButtonElement).disabled).toBe(true);
  });

  it('steps through the questions, reporting each answer', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.mode.set('questions');
    fixture.componentInstance.questions.set(QUESTIONS);
    fixture.detectChanges();

    buttonByLabel('18 Lacey Ln')?.click();
    fixture.detectChanges();
    expect(buttonByLabel('18 Lacey Ln')?.getAttribute('aria-pressed')).toBe('true');
    buttonByLabel('Next')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.answers).toEqual([ { questionType: 'q-address', choice: '18 Lacey Ln' } ]);

    // The second (last) question resets the selection and switches the action to Submit.
    expect(panel().textContent).toContain('(2/2)');
    expect(panel().textContent).toContain('Select the county you have lived in.');
    const submit = buttonByLabel('Submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    buttonByLabel('Marion')?.click();
    fixture.detectChanges();
    submit.click();
    expect(fixture.componentInstance.answers).toEqual([
      { questionType: 'q-address', choice: '18 Lacey Ln' },
      { questionType: 'q-county', choice: 'Marion' },
    ]);
  });

  it('hides the step counter for a single question and cancels from the button', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.mode.set('questions');
    fixture.componentInstance.questions.set(QUESTIONS.slice(0, 1));
    fixture.detectChanges();

    expect(panel().textContent).not.toContain('(1/1)');
    expect((buttonByLabel('Submit') as HTMLButtonElement).disabled).toBe(true);

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
