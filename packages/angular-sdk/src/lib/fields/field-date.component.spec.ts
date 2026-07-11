import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldDateComponent } from './field-date.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'lease-start-1',
  role_name: 'Recipient 1',
  type: 'date',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Lease Start',
  prepared: false,
  page: 1,
  x: 96,
  y: 220,
  width: 74,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldDateComponent', () => {
  @Component({
    imports: [ VerdocsFieldDateComponent ],
    template: `<verdocs-field-date [field]="field()" [disabled]="disabled()" [done]="done()" (fieldChange)="changes.push($event)" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    changes: string[] = [];
  }

  const dateInput = (fixture: { nativeElement: HTMLElement }): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="date"]') as HTMLInputElement;

  const host = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
    fixture.nativeElement.querySelector('verdocs-field-date') as HTMLElement;

  it('seeds a native date input from the field value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: '2026-08-01' }));
    fixture.detectChanges();

    expect(dateInput(fixture).value).toBe('2026-08-01');
    expect(dateInput(fixture).getAttribute('aria-label')).toBe('Lease Start');
  });

  it('trims full ISO timestamps to the date the input understands', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: '2026-08-01T15:30:00.000Z' }));
    fixture.detectChanges();

    expect(dateInput(fixture).value).toBe('2026-08-01');
  });

  it('reports picked dates as ISO yyyy-mm-dd strings', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    dateInput(fixture).value = '2026-08-15';
    dateInput(fixture).dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.changes).toEqual([ '2026-08-15' ]);
  });

  it('disables input when disabled or the field is readonly, and marks required fields', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ required: true }));
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(dateInput(fixture).disabled).toBe(true);
    expect(dateInput(fixture).required).toBe(true);
    expect(host(fixture).classList.contains('vdocs-field-required')).toBe(true);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();
    expect(dateInput(fixture).disabled).toBe(true);
  });

  it('renders the final date as local text when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: '2026-08-01' }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(new Date(2026, 7, 1).toLocaleDateString());
    expect(host(fixture).classList.contains('vdocs-field-done')).toBe(true);
  });
});
