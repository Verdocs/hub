import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsDialogComponent } from './dialog.component';

describe('VerdocsDialogComponent', () => {
  @Component({
    imports: [ VerdocsDialogComponent ],
    template: `
      <verdocs-dialog heading="Test Title" [persistent]="persistent()" [footer]="footerTpl" (closed)="closes = closes + 1">Body text</verdocs-dialog>
      <ng-template #footerTpl><button type="button" class="confirm">Confirm</button></ng-template>
    `,
  })
  class HostComponent {
    closes = 0;
    persistent = signal(false);
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const panel = () => document.querySelector('[role="dialog"]') as HTMLElement;
  const closeButton = () => document.querySelector('button[aria-label="Close"]') as HTMLButtonElement;

  it('renders heading, body, and footer in a modal portaled to document.body', async () => {
    const fixture = await createFixture();

    expect(panel()).not.toBeNull();
    expect(panel().getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.contains(panel())).toBe(false);
    expect(panel().textContent).toContain('Test Title');
    expect(panel().textContent).toContain('Body text');
    expect(panel().querySelector('.confirm')).not.toBeNull();

    fixture.destroy();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes via the close button and the overlay, but not panel clicks', async () => {
    const fixture = await createFixture();

    panel().click();
    expect(fixture.componentInstance.closes).toBe(0);

    closeButton().click();
    expect(fixture.componentInstance.closes).toBe(1);

    (panel().parentElement as HTMLElement).click();
    expect(fixture.componentInstance.closes).toBe(2);
  });

  it('ignores overlay clicks when persistent', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.persistent.set(true);
    fixture.detectChanges();

    (panel().parentElement as HTMLElement).click();
    expect(fixture.componentInstance.closes).toBe(0);

    // The explicit close button still works on persistent dialogs
    closeButton().click();
    expect(fixture.componentInstance.closes).toBe(1);
  });
});
