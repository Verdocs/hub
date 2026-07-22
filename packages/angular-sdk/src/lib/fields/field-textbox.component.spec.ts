import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldTextboxComponent } from './field-textbox.component';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-textbox-1',
  role_name: 'Recipient 1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 180,
  y: 260,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldTextboxComponent', () => {
  @Component({
    imports: [ VerdocsFieldTextboxComponent ],
    template: `<verdocs-field-textbox [field]="field()" [disabled]="disabled()" [done]="done()" (fieldChange)="changes.push($event)" />`,
  })
  class HostComponent {
    field = signal(sampleField());
    disabled = signal(false);
    done = signal(false);
    changes: string[] = [];
  }

  const textbox = (fixture: { nativeElement: HTMLElement }): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;

  it('renders the current value and placeholder', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'Jane Smith' }));
    fixture.detectChanges();

    expect(textbox(fixture).value).toBe('Jane Smith');
    expect(textbox(fixture).getAttribute('aria-label')).toBe('Buyer-textbox-1');

    fixture.componentInstance.field.set(sampleField());
    fixture.detectChanges();
    expect(textbox(fixture).value).toBe('');
    expect(textbox(fixture).placeholder).toBe('Full name');
  });

  it('emits fieldChange with the updated text', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    textbox(fixture).value = 'Jane';
    textbox(fixture).dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.changes).toEqual([ 'Jane' ]);
  });

  it('caps input length based on the field width', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ width: 50 }));
    fixture.detectChanges();

    expect(textbox(fixture).maxLength).toBe(10);
  });

  it('blocks input when disabled or the field is readonly', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(textbox(fixture).disabled).toBe(true);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.field.set(sampleField({ readonly: true }));
    fixture.detectChanges();
    expect(textbox(fixture).disabled).toBe(true);
  });

  it('renders the value as plain text when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(sampleField({ value: 'Jane Smith' }));
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Jane Smith');
  });
});
