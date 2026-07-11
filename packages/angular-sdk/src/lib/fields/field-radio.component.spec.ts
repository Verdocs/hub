import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldRadioComponent } from './field-radio.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-financing-cash',
  role_name: 'Recipient 1',
  type: 'radio',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 150,
  y: 410,
  width: 14,
  height: 14,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'financing-choice',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldRadioComponent', () => {
  @Component({
    imports: [ VerdocsFieldRadioComponent ],
    template: `<verdocs-field-radio [field]="field()" [disabled]="disabled()" [done]="done()" (fieldChange)="changes.push($event)" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    changes: string[] = [];
  }

  const radio = (fixture: { nativeElement: HTMLElement }): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement;

  it('renders unselected with the group name when the field has no value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(radio(fixture).checked).toBe(false);
    expect(radio(fixture).name).toBe('financing-choice');
  });

  it('renders selected from the field value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'true' }));
    fixture.detectChanges();

    expect(radio(fixture).checked).toBe(true);
  });

  it('emits fieldChange with the option id when selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    radio(fixture).click();

    expect(fixture.componentInstance.changes).toEqual([ 'Buyer-financing-cash' ]);
  });

  it('cannot be selected when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(radio(fixture).disabled).toBe(true);

    radio(fixture).click();
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(radio(fixture).checked).toBe(false);
  });

  it('disables the input for readonly fields', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();

    expect(radio(fixture).disabled).toBe(true);
  });

  it('renders the final glyph instead of an input when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'true' }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe('Selected');

    fixture.componentInstance.field.set(sampleField());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe('Not selected');
  });
});
