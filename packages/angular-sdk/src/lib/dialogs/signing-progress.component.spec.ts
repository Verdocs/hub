import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsSigningProgressComponent, type TSigningProgressMode } from './signing-progress.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-signature-1',
  role_name: 'Recipient 1',
  type: 'signature',
  required: true,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 120,
  height: 40,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const signature = sampleField();
const dateSigned = sampleField({ name: 'Buyer-date-1', type: 'date' });
const comments = sampleField({ name: 'Buyer-textbox-1', type: 'textbox', required: false });

describe('VerdocsSigningProgressComponent', () => {
  @Component({
    imports: [ VerdocsSigningProgressComponent ],
    template: `
      <verdocs-signing-progress
        [mode]="mode()"
        [fields]="fields()"
        [focusedField]="focusedField()"
        (start)="starts = starts + 1"
        (next)="nexts = nexts + 1"
        (previous)="previouses = previouses + 1"
        (submit)="submits = submits + 1" />
    `,
  })
  class HostComponent {
    starts = 0;
    nexts = 0;
    previouses = 0;
    submits = 0;
    mode = signal<TSigningProgressMode>('start');
    fields = signal<IEnvelopeField[]>([]);
    focusedField = signal('');
  }

  function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  const buttonByLabel = (fixture: { nativeElement: HTMLElement }, label: string) =>
    Array.from(fixture.nativeElement.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as
    | HTMLButtonElement |
    undefined;

  it('renders counts, the focused field label, and Start Signing in start mode', () => {
    const fixture = createFixture();
    fixture.componentInstance.fields.set([ signature, dateSigned ]);
    fixture.componentInstance.focusedField.set('Buyer-signature-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2 of 2 required fields remaining');
    expect(fixture.nativeElement.textContent).toContain('Required Signature*');

    buttonByLabel(fixture, 'Start Signing')?.click();
    expect(fixture.componentInstance.starts).toBe(1);
  });

  it('only shows the optional line when optional fields exist', () => {
    const fixture = createFixture();
    fixture.componentInstance.mode.set('signing');
    fixture.componentInstance.fields.set([ signature, dateSigned ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('optional fields remaining');

    fixture.componentInstance.fields.set([ signature, comments ]);
    fixture.componentInstance.focusedField.set('Buyer-textbox-1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 of 1 optional fields remaining');
    expect(fixture.nativeElement.textContent).toContain('Optional Text Field');
  });

  it('counts filled fields as no longer remaining, with the strict grouped-radio check', () => {
    const fixture = createFixture();
    fixture.componentInstance.mode.set('signing');
    fixture.componentInstance.fields.set([ sampleField({ value: 'signed' }), dateSigned ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 of 2 required fields remaining');

    // js-sdk's isFieldFilled would count the whole group as filled because the
    // sibling is selected; the card's stricter check keeps the focused radio open.
    const radioOn = sampleField({ name: 'Buyer-radio-1', type: 'radio', group: 'choices', value: 'true' });
    const radioOff = sampleField({ name: 'Buyer-radio-2', type: 'radio', group: 'choices', value: null });
    fixture.componentInstance.fields.set([ radioOn, radioOff ]);
    fixture.componentInstance.focusedField.set('Buyer-radio-2');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 of 2 required fields remaining');
    expect(fixture.nativeElement.textContent).toContain('Required Radio Button*');
  });

  it('disables Previous on the first field and Next on the last, firing the events between', () => {
    const fixture = createFixture();
    fixture.componentInstance.mode.set('signing');
    fixture.componentInstance.fields.set([ signature, dateSigned ]);
    fixture.componentInstance.focusedField.set('Buyer-signature-1');
    fixture.detectChanges();

    expect((buttonByLabel(fixture, 'Previous') as HTMLButtonElement).disabled).toBe(true);
    buttonByLabel(fixture, 'Next')?.click();
    expect(fixture.componentInstance.nexts).toBe(1);

    fixture.componentInstance.focusedField.set('Buyer-date-1');
    fixture.detectChanges();
    expect((buttonByLabel(fixture, 'Next') as HTMLButtonElement).disabled).toBe(true);
    buttonByLabel(fixture, 'Previous')?.click();
    expect(fixture.componentInstance.previouses).toBe(1);
  });

  it('offers Submit once every required field is filled', () => {
    const fixture = createFixture();
    fixture.componentInstance.mode.set('signing');
    fixture.componentInstance.fields.set([
      sampleField({ value: 'signed' }),
      sampleField({ name: 'Buyer-date-1', type: 'date', value: '2026-07-10' }),
    ]);
    fixture.componentInstance.focusedField.set('Buyer-date-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0 of 2 required fields remaining');
    expect(fixture.nativeElement.textContent).toContain('Ready to submit.');
    expect(buttonByLabel(fixture, 'Next')).toBeUndefined();

    buttonByLabel(fixture, 'Submit')?.click();
    expect(fixture.componentInstance.submits).toBe(1);
  });

  it('renders the completed card with Submit and no counts', () => {
    const fixture = createFixture();
    fixture.componentInstance.mode.set('completed');
    fixture.componentInstance.fields.set([ signature ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ready to Submit');
    expect(fixture.nativeElement.textContent).toContain('You have entered all requested signatures. Select Submit to complete the signing process.');
    expect(fixture.nativeElement.textContent).not.toContain('required fields remaining');

    buttonByLabel(fixture, 'Submit')?.click();
    expect(fixture.componentInstance.submits).toBe(1);
  });
});
