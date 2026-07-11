import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsDisclosureDialogComponent } from './disclosure-dialog.component';

describe('VerdocsDisclosureDialogComponent', () => {
  @Component({
    imports: [ VerdocsDisclosureDialogComponent ],
    template: `
      <verdocs-disclosure-dialog
        [disclosures]="custom() ? customTpl : null"
        [delegator]="delegator()"
        (agree)="agrees = agrees + 1"
        (decline)="declines = declines + 1"
        (delegate)="delegates = delegates + 1"
        (cancel)="cancels = cancels + 1" />
      <ng-template #customTpl><p class="custom">Acme custom consent text</p></ng-template>
    `,
  })
  class HostComponent {
    agrees = 0;
    declines = 0;
    delegates = 0;
    cancels = 0;
    custom = signal(false);
    delegator = signal(false);
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('renders the heading and the default disclosure content', async () => {
    await createFixture();
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;

    expect(panel.textContent).toContain('e-Signature Disclosures');
    expect(panel.querySelector('a[href="https://verdocs.com/en/electronic-record-signature-disclosure/"]')?.textContent)
      .toContain('Electronic Record and Signatures Disclosure');
    expect(panel.querySelector('a[href="https://verdocs.com/en/eula"]')?.textContent).toContain('End User License Agreement');
    expect(panel.querySelector('a[href="https://verdocs.com/en/privacy-policy/"]')?.textContent).toContain('Privacy Policy');
  });

  it('renders custom disclosure content in place of the default', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.custom.set(true);
    fixture.detectChanges();
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;

    expect(panel.querySelector('.custom')?.textContent).toBe('Acme custom consent text');
    expect(panel.querySelector('a[href="https://verdocs.com/en/eula"]')).toBeNull();
  });

  it('keeps Proceed disabled until the acceptance box is checked, then fires agree', async () => {
    const fixture = await createFixture();

    const proceed = buttonByLabel('Proceed') as HTMLButtonElement;
    expect(proceed.disabled).toBe(true);
    proceed.click();
    expect(fixture.componentInstance.agrees).toBe(0);

    (document.querySelector('[role="dialog"] input[type="checkbox"]') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(proceed.disabled).toBe(false);

    proceed.click();
    expect(fixture.componentInstance.agrees).toBe(1);
  });

  it('fires decline without requiring acceptance', async () => {
    const fixture = await createFixture();

    buttonByLabel('Decline')?.click();
    expect(fixture.componentInstance.declines).toBe(1);
  });

  it('only offers Delegate when the recipient is a delegator, and fires delegate', async () => {
    const fixture = await createFixture();

    expect(buttonByLabel('Delegate')).toBeUndefined();

    fixture.componentInstance.delegator.set(true);
    fixture.detectChanges();
    buttonByLabel('Delegate')?.click();
    expect(fixture.componentInstance.delegates).toBe(1);
  });

  it('fires cancel when dismissed via the close button', async () => {
    const fixture = await createFixture();

    (document.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
