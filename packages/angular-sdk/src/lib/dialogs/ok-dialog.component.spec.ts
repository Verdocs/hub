import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsOkDialogComponent } from './ok-dialog.component';

describe('VerdocsOkDialogComponent', () => {
  @Component({
    imports: [ VerdocsOkDialogComponent ],
    template: `
      <verdocs-ok-dialog
        [heading]="heading()"
        [message]="message()"
        [buttonLabel]="buttonLabel()"
        [showCancel]="showCancel()"
        (ok)="oks = oks + 1"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    oks = 0;
    cancels = 0;
    heading = signal(`You're Done!`);
    message = signal('All set.');
    buttonLabel = signal('OK');
    showCancel = signal(false);
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label);

  it('renders the heading and message and fires ok', async () => {
    const fixture = await createFixture();
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;

    expect(panel.textContent).toContain(`You're Done!`);
    expect(panel.textContent).toContain('All set.');
    expect(buttonByLabel('Cancel')).toBeUndefined();

    buttonByLabel('OK')?.click();
    expect(fixture.componentInstance.oks).toBe(1);
    expect(fixture.componentInstance.cancels).toBe(0);
  });

  it('shows a Cancel button and a custom OK label when asked', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.buttonLabel.set('Decline');
    fixture.componentInstance.showCancel.set(true);
    fixture.detectChanges();

    expect(buttonByLabel('Decline')).toBeDefined();

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);
    expect(fixture.componentInstance.oks).toBe(0);
  });

  it('treats dismissal as a cancel', async () => {
    const fixture = await createFixture();

    (document.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
