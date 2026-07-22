import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsOtpDialogComponent } from './otp-dialog.component';

describe('VerdocsOtpDialogComponent', () => {
  @Component({
    imports: [ VerdocsOtpDialogComponent ],
    template: `<verdocs-otp-dialog [error]="error()" (submit)="submitted = $event" (resend)="resends = resends + 1" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    submitted: string | null = null;
    resends = 0;
    cancels = 0;
    error = signal('');
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement;
  const codeInput = () => document.querySelector('input[placeholder="Enter your one-time code..."]') as HTMLInputElement;

  it('submits the entered code and clears the input for the next attempt', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((document.querySelector('[role="dialog"]') as HTMLElement).textContent).toContain('Verification Required');
    expect(buttonByLabel('Submit').disabled).toBe(true);

    codeInput().value = '123456';
    codeInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(buttonByLabel('Submit').disabled).toBe(false);

    buttonByLabel('Submit').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.submitted).toBe('123456');
    expect(codeInput().value).toBe('');
  });

  it('unlocks Resend after the cooldown and locks it again after resending', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(buttonByLabel('Resend').disabled).toBe(true);

    vi.advanceTimersByTime(30000);
    fixture.detectChanges();
    expect(buttonByLabel('Resend').disabled).toBe(false);

    buttonByLabel('Resend').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.resends).toBe(1);
    expect(buttonByLabel('Resend').disabled).toBe(true);
  });

  it('shows the error message when set', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error.set('Invalid verification code. Please try again.');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Invalid verification code. Please try again.');
  });

  it('cancels from the Cancel button but not the overlay', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    // The legacy dialog was persistent: clicking the background does not dismiss it.
    const overlay = document.querySelector('[role="dialog"]')?.parentElement as HTMLElement;
    overlay.click();
    expect(fixture.componentInstance.cancels).toBe(0);

    buttonByLabel('Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
