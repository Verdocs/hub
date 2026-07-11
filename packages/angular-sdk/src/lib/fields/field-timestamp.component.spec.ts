import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldTimestampComponent } from './field-timestamp.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'signed-at-1',
  role_name: 'Recipient 1',
  type: 'timestamp',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Signed At',
  prepared: false,
  page: 1,
  x: 360,
  y: 640,
  width: 160,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldTimestampComponent', () => {
  @Component({
    imports: [ VerdocsFieldTimestampComponent ],
    template: `<verdocs-field-timestamp [field]="field()" [done]="done()" [signerIndex]="signerIndex()" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    done = signal(false);
    signerIndex = signal(0);
  }

  const host = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
    fixture.nativeElement.querySelector('verdocs-field-timestamp') as HTMLElement;

  it('hints that empty fields fill at signing time', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Filled at signing');
  });

  it('prefers the field placeholder for the hint', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ placeholder: 'Stamped on submit' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Stamped on submit');
    expect(fixture.nativeElement.textContent).not.toContain('Filled at signing');
  });

  it('displays a set value as a localized timestamp with the signer class', () => {
    const value = '2026-07-10T14:32:05.000Z';
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value }));
    fixture.componentInstance.signerIndex.set(1);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(new Date(value).toLocaleString());
    expect(host(fixture).classList.contains('vdocs-field')).toBe(true);
    expect(host(fixture).classList.contains('vdocs-signer-2')).toBe(true);
  });

  it('offers no input, and marks required fields on the host', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ required: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(host(fixture).classList.contains('vdocs-field-required')).toBe(true);
  });

  it('renders the done treatment with the final value', () => {
    const value = '2026-07-10T14:32:05.000Z';
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(new Date(value).toLocaleString());
    expect(host(fixture).classList.contains('vdocs-field-done')).toBe(true);
    expect(host(fixture).classList.contains('vdocs-signer-1')).toBe(false);
  });
});
