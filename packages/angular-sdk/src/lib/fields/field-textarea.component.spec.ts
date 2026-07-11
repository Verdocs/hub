import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldTextareaComponent } from './field-textarea.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'special-instructions-1',
  role_name: 'Recipient 1',
  type: 'textarea',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Special Instructions',
  prepared: false,
  page: 1,
  x: 120,
  y: 480,
  width: 150,
  height: 45,
  default: null,
  placeholder: 'Anything the property manager should know',
  multiline: true,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldTextareaComponent', () => {
  @Component({
    imports: [ VerdocsFieldTextareaComponent ],
    template: `<verdocs-field-textarea [field]="field()" [disabled]="disabled()" [done]="done()" [signerIndex]="signerIndex()" (fieldChange)="changes.push($event)" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    signerIndex = signal(0);
    changes: string[] = [];
  }

  const textarea = (fixture: { nativeElement: HTMLElement }): HTMLTextAreaElement =>
    fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

  const host = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
    fixture.nativeElement.querySelector('verdocs-field-textarea') as HTMLElement;

  it('renders the current value with the signer wrapper class', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'Gate code is 4482.' }));
    fixture.componentInstance.signerIndex.set(1);
    fixture.detectChanges();

    expect(textarea(fixture).value).toBe('Gate code is 4482.');
    expect(host(fixture).classList.contains('vdocs-field')).toBe(true);
    expect(host(fixture).classList.contains('vdocs-signer-2')).toBe(true);
  });

  it('reports edits through fieldChange', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    textarea(fixture).value = 'Hi';
    textarea(fixture).dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.changes).toEqual([ 'Hi' ]);
  });

  it('disables input when disabled or the field is readonly', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(textarea(fixture).disabled).toBe(true);
    expect(host(fixture).classList.contains('vdocs-field-disabled')).toBe(true);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();
    expect(textarea(fixture).disabled).toBe(true);
  });

  it('marks required fields on the textarea and the host', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ required: true }));
    fixture.detectChanges();

    expect(textarea(fixture).required).toBe(true);
    expect(host(fixture).classList.contains('vdocs-field-required')).toBe(true);
  });

  it('renders the final value without a textarea when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'Signed and sealed' }));
    fixture.componentInstance.signerIndex.set(0);
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Signed and sealed');
    expect(host(fixture).classList.contains('vdocs-field-done')).toBe(true);
    expect(host(fixture).classList.contains('vdocs-signer-1')).toBe(false);
  });
});
