import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldDropdownComponent } from './field-dropdown.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-dropdown-1',
  role_name: 'Recipient 1',
  type: 'dropdown',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 500,
  width: 85,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: [
    { id: 'purchase', label: 'Purchase' },
    { id: 'refinance', label: 'Refinance' },
    { id: 'cash-out', label: 'Cash Out' },
  ],
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldDropdownComponent', () => {
  @Component({
    imports: [ VerdocsFieldDropdownComponent ],
    template: `<verdocs-field-dropdown [field]="field()" [disabled]="disabled()" [done]="done()" (fieldChange)="changes.push($event)" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    changes: string[] = [];
  }

  const select = (fixture: { nativeElement: HTMLElement }): HTMLSelectElement =>
    fixture.nativeElement.querySelector('select') as HTMLSelectElement;

  it('renders the options and the current value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'refinance' }));
    fixture.detectChanges();

    expect(select(fixture).value).toBe('refinance');
    expect(select(fixture).getAttribute('aria-label')).toBe('Buyer-dropdown-1');

    const labels = Array.from(fixture.nativeElement.querySelectorAll('option')).map(option => (option as HTMLOptionElement).textContent?.trim());
    expect(labels).toEqual([ 'Select...', 'Purchase', 'Refinance', 'Cash Out' ]);
  });

  it('emits fieldChange with the selected option id', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    select(fixture).value = 'cash-out';
    select(fixture).dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.changes).toEqual([ 'cash-out' ]);
  });

  it('disables the select when disabled or the field is readonly', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(select(fixture).disabled).toBe(true);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();
    expect(select(fixture).disabled).toBe(true);
  });

  it('falls back to an N/A option when the field has none', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ options: null }));
    fixture.detectChanges();

    const labels = Array.from(fixture.nativeElement.querySelectorAll('option')).map(option => (option as HTMLOptionElement).textContent?.trim());
    expect(labels).toEqual([ 'Select...', 'N/A' ]);
  });

  it('renders the value as plain text when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'refinance' }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('refinance');
  });
});
