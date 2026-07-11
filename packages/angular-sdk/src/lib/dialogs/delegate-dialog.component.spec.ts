import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsDelegateDialogComponent, type IDelegateDetails } from './delegate-dialog.component';

describe('VerdocsDelegateDialogComponent', () => {
  @Component({
    imports: [ VerdocsDelegateDialogComponent ],
    template: `<verdocs-delegate-dialog (delegate)="delegated = $event" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    delegated: IDelegateDetails | null = null;
    cancels = 0;
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement;

  function type(placeholder: string, value: string) {
    // Scoped to the native elements: the static placeholder attribute also sits
    // on the verdocs-text-input host, which would match first in document order.
    const input = document.querySelector(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`) as
      | HTMLInputElement |
      HTMLTextAreaElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('disables Delegate until the required fields are filled, then submits the details', async () => {
    const fixture = await createFixture();

    expect((document.querySelector('[role="dialog"]') as HTMLElement).textContent).toContain('Delegate Signing');
    expect(buttonByLabel('Delegate').disabled).toBe(true);

    type('First name', 'Sue');
    type('Last name', 'Ridge');
    fixture.detectChanges();
    expect(buttonByLabel('Delegate').disabled).toBe(true);

    type('New recipient email address', 'sue@example.com');
    fixture.detectChanges();
    expect(buttonByLabel('Delegate').disabled).toBe(false);

    buttonByLabel('Delegate').click();
    expect(fixture.componentInstance.delegated).toEqual({
      first_name: 'Sue',
      last_name: 'Ridge',
      email: 'sue@example.com',
      phone: '',
      message: '',
    });
  });

  it('includes the optional phone and message when provided', async () => {
    const fixture = await createFixture();

    type('First name', 'Sue');
    type('Last name', 'Ridge');
    type('New recipient email address', 'sue@example.com');
    type('Optional phone number', '+15555550123');
    type('Type message here...', 'Please sign this for me.');
    fixture.detectChanges();

    buttonByLabel('Delegate').click();
    expect(fixture.componentInstance.delegated).toEqual({
      first_name: 'Sue',
      last_name: 'Ridge',
      email: 'sue@example.com',
      phone: '+15555550123',
      message: 'Please sign this for me.',
    });
  });

  it('cancels from the Cancel button and the overlay', async () => {
    const fixture = await createFixture();

    buttonByLabel('Cancel').click();
    expect(fixture.componentInstance.cancels).toBe(1);

    (document.querySelector('[role="dialog"]')?.parentElement as HTMLElement).click();
    expect(fixture.componentInstance.cancels).toBe(2);
  });
});
