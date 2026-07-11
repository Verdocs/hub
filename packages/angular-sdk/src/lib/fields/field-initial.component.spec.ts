import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { VerdocsFieldInitialComponent } from './field-initial.component';

const buildField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: 'env-1',
  document_id: 'doc-1',
  name: 'recipient-1-initial-1',
  role_name: 'Recipient 1',
  type: 'initial',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 480,
  y: 640,
  width: 83,
  height: 36,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const FAKE_URL = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';

describe('VerdocsFieldInitialComponent', () => {
  @Component({
    imports: [ VerdocsFieldInitialComponent ],
    template: `
      <verdocs-field-initial
        [field]="field()"
        [disabled]="disabled()"
        [done]="done()"
        [focused]="focused()"
        [signerIndex]="signerIndex()"
        [initialUrl]="initialUrl()"
        (beginSigning)="signings = signings + 1" />
    `,
  })
  class HostComponent {
    field = signal(buildField());
    disabled = signal(false);
    done = signal(false);
    focused = signal(false);
    signerIndex = signal(0);
    initialUrl = signal('');
    signings = 0;
  }

  const affordance = (fixture: { nativeElement: HTMLElement }): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('button');

  const host = (fixture: { nativeElement: HTMLElement }): HTMLElement =>
    fixture.nativeElement.querySelector('verdocs-field-initial') as HTMLElement;

  it('renders the initialing affordance and reports clicks when empty', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(affordance(fixture)?.textContent).toContain('Initial');

    affordance(fixture)?.click();
    expect(fixture.componentInstance.signings).toBe(1);
  });

  it('does not begin signing when disabled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(affordance(fixture)?.disabled).toBe(true);

    affordance(fixture)?.click();
    expect(fixture.componentInstance.signings).toBe(0);
  });

  it('renders the adopted initials image instead of the affordance when filled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.initialUrl.set(FAKE_URL);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe(FAKE_URL);
    expect(affordance(fixture)).toBeNull();
    expect(host(fixture).classList.contains('vdocs-filled')).toBe(true);
  });

  it('renders only the final image when done', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.initialUrl.set(FAKE_URL);
    fixture.componentInstance.done.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe(FAKE_URL);
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

  it('marks required fields with the required state class', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.field.set(buildField({ required: true }));
    fixture.detectChanges();

    expect(host(fixture).classList.contains('vdocs-required')).toBe(true);
  });
});
