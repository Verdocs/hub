import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldPaymentComponent } from './field-payment.component';

const buildField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: 'env-1',
  document_id: 'doc-1',
  name: 'recipient-1-payment-1',
  role_name: 'Recipient 1',
  type: 'payment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 300,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('VerdocsFieldPaymentComponent', () => {
  @Component({
    imports: [ VerdocsFieldPaymentComponent ],
    template: `
      <verdocs-field-payment
        [field]="field()"
        [disabled]="disabled()"
        [done]="done()"
        [focused]="focused()"
        [signerIndex]="signerIndex()"
        [paid]="paid()"
        (beginPayment)="payments = payments + 1" />
    `,
  })
  class HostComponent {
    field = signal(buildField());
    disabled = signal(false);
    done = signal(false);
    focused = signal(false);
    signerIndex = signal(0);
    paid = signal(false);
    payments = 0;
  }

  const affordance = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('button[aria-label="Payment"]');

  const paidTreatment = (fixture: { nativeElement: HTMLElement }): HTMLElement | null =>
    fixture.nativeElement.querySelector('span[aria-label="Paid"]');

  const host = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
    fixture.nativeElement.querySelector('verdocs-field-payment') as HTMLElement;

  it('renders the payment affordance and reports clicks when unpaid', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    affordance(fixture)?.click();

    expect(fixture.componentInstance.payments).toBe(1);
  });

  it('does not begin payment when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(affordance(fixture)?.disabled).toBe(true);

    affordance(fixture)?.click();
    expect(fixture.componentInstance.payments).toBe(0);
  });

  it('renders the paid treatment instead of the affordance when paid', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.paid.set(true);
    fixture.detectChanges();

    expect(paidTreatment(fixture)).toBeTruthy();
    expect(affordance(fixture)).toBeNull();
    expect(host(fixture).classList.contains('vdocs-filled')).toBe(true);
  });

  it('renders the paid treatment when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(paidTreatment(fixture)).toBeTruthy();
    expect(affordance(fixture)).toBeNull();
    expect(host(fixture).classList.contains('vdocs-done')).toBe(true);
  });

  it('focuses the affordance when focused is set', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.focused.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(affordance(fixture));
  });

  it('applies the signer color class for the signer index', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.signerIndex.set(1);
    fixture.detectChanges();

    expect(host(fixture).classList.contains('vdocs-signer-2')).toBe(true);
  });

  it('marks the field with the disabled state class when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(host(fixture).classList.contains('vdocs-disabled')).toBe(true);
  });
});
