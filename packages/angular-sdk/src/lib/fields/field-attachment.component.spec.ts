import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldAttachmentComponent } from './field-attachment.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'proof-of-insurance-1',
  role_name: 'Recipient 1',
  type: 'attachment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Proof of Insurance',
  prepared: false,
  page: 1,
  x: 72,
  y: 590,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

function pickFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', { value: [ file ], configurable: true });
  input.dispatchEvent(new Event('change'));
}

describe('VerdocsFieldAttachmentComponent', () => {
  @Component({
    imports: [ VerdocsFieldAttachmentComponent ],
    template: `
      <verdocs-field-attachment
        [field]="field()"
        [disabled]="disabled()"
        [done]="done()"
        (selectFile)="selected.push($event)"
        (deleteFile)="deletes = deletes + 1" />
    `,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    selected: File[] = [];
    deletes = 0;
  }

  const pickButton = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[aria-label="Proof of Insurance"]') as HTMLButtonElement;

  const removeButton = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('button[aria-label="Remove attachment"]');

  const host = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
    fixture.nativeElement.querySelector('verdocs-field-attachment') as HTMLElement;

  it('reports a picked file through selectFile', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(pickButton(fixture)).toBeTruthy();

    const file = pdf('renters-policy.pdf');
    pickFile(fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement, file);

    expect(fixture.componentInstance.selected).toEqual([ file ]);
  });

  it('surfaces the attached file name and a delete affordance', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'renters-policy.pdf' }));
    fixture.detectChanges();

    expect(pickButton(fixture).getAttribute('title')).toBe('renters-policy.pdf');

    removeButton(fixture)?.click();
    expect(fixture.componentInstance.deletes).toBe(1);
  });

  it('deactivates when disabled or the field is readonly', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'renters-policy.pdf' }));
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(pickButton(fixture).disabled).toBe(true);
    expect(removeButton(fixture)).toBeNull();

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();
    expect(pickButton(fixture).disabled).toBe(true);
  });

  it('marks required fields on the host', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ required: true }));
    fixture.detectChanges();

    expect(host(fixture).classList.contains('vdocs-field-required')).toBe(true);
  });

  it('renders only a status icon when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'renters-policy.pdf' }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg title')?.textContent).toBe('File attached');
    expect(host(fixture).classList.contains('vdocs-field-done')).toBe(true);
  });
});
