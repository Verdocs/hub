import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldCheckboxComponent } from './field-checkbox.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-checkbox-1',
  role_name: 'Recipient 1',
  type: 'checkbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 16,
  height: 16,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'purchase-options',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldCheckboxComponent', () => {
  @Component({
    imports: [ VerdocsFieldCheckboxComponent ],
    template: `<verdocs-field-checkbox [field]="field()" [disabled]="disabled()" [done]="done()" (fieldChange)="changes.push($event)" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    changes: boolean[] = [];
  }

  const box = (fixture: { nativeElement: HTMLElement }): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;

  it('renders unchecked when the field has no value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(box(fixture).checked).toBe(false);
    expect(box(fixture).name).toBe('Buyer-checkbox-1');
  });

  it('renders checked from the field value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'true' }));
    fixture.detectChanges();

    expect(box(fixture).checked).toBe(true);
  });

  it('emits fieldChange with the new checked state', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    box(fixture).click();
    expect(fixture.componentInstance.changes).toEqual([ true ]);

    box(fixture).click();
    expect(fixture.componentInstance.changes).toEqual([ true, false ]);
  });

  it('cannot be toggled when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(box(fixture).disabled).toBe(true);

    box(fixture).click();
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(box(fixture).checked).toBe(false);
  });

  it('disables the input for readonly fields', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();

    expect(box(fixture).disabled).toBe(true);
  });

  it('renders the final glyph instead of an input when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'true' }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe('Checked');

    fixture.componentInstance.field.set(sampleField());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe('Unchecked');
  });
});
