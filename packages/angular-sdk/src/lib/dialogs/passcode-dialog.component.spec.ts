import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsPasscodeDialogComponent } from './passcode-dialog.component';

describe('VerdocsPasscodeDialogComponent', () => {
  @Component({
    imports: [ VerdocsPasscodeDialogComponent ],
    template: `<verdocs-passcode-dialog [error]="error()" (submit)="submitted = $event" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    submitted: string | null = null;
    cancels = 0;
    error = signal('');
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement;
  const codeInput = () => document.querySelector('input[placeholder="Enter passcode..."]') as HTMLInputElement;

  it('submits the entered passcode and clears the input for the next attempt', async () => {
    const fixture = await createFixture();

    expect((document.querySelector('[role="dialog"]') as HTMLElement).textContent).toContain('Passcode Required');
    expect(buttonByLabel('Submit').disabled).toBe(true);

    codeInput().value = 'open-sesame';
    codeInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(buttonByLabel('Submit').disabled).toBe(false);

    buttonByLabel('Submit').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.submitted).toBe('open-sesame');
    expect(codeInput().value).toBe('');
  });

  it('shows the error message when set', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.error.set('Invalid passcode. Please try again.');
    fixture.detectChanges();

    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Invalid passcode. Please try again.');
  });

  it('cancels from the Cancel button but not the overlay', async () => {
    const fixture = await createFixture();

    // The legacy dialog was persistent: clicking the background does not dismiss it.
    const overlay = document.querySelector('[role="dialog"]')?.parentElement as HTMLElement;
    overlay.click();
    expect(fixture.componentInstance.cancels).toBe(0);

    buttonByLabel('Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
