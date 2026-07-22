import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IOrganization } from '@verdocs/js-sdk';
import { VerdocsSignFooterComponent } from './sign-footer.component';

describe('VerdocsSignFooterComponent', () => {
  @Component({
    imports: [ VerdocsSignFooterComponent ],
    template: `
      <verdocs-sign-footer
        [organization]="organization()"
        [isDone]="isDone()"
        (askQuestion)="questions.push($event)"
        (decline)="declines = declines + 1"
        (finishLater)="finishLaters = finishLaters + 1" />
    `,
  })
  class HostComponent {
    organization = signal<Partial<IOrganization> | null>(null);
    isDone = signal(false);
    questions: string[] = [];
    declines = 0;
    finishLaters = 0;
  }

  const render = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  const buttonByText = (text: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes(text)) as HTMLButtonElement;

  it('fires the decline and finish-later outputs', () => {
    const fixture = render();

    buttonByText('Decline Signing').click();
    buttonByText('Finish Later').click();

    expect(fixture.componentInstance.declines).toBe(1);
    expect(fixture.componentInstance.finishLaters).toBe(1);
  });

  it('collects a question through the dialog and reports it', async () => {
    const fixture = render();

    buttonByText('Ask Sender a Question').click();
    fixture.detectChanges();
    await fixture.whenStable();

    // The dialog moves itself to document.body, so query the document.
    const textarea = document.querySelector('textarea[aria-label="Question"]') as HTMLTextAreaElement;
    textarea.value = 'When is this due?';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByText('OK').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.questions).toEqual([ 'When is this due?' ]);
    expect(document.querySelector('textarea[aria-label="Question"]')).toBeNull();
  });

  it('cancelling the question dialog reports nothing', async () => {
    const fixture = render();

    buttonByText('Ask Sender a Question').click();
    fixture.detectChanges();
    await fixture.whenStable();

    buttonByText('Cancel').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.questions).toEqual([]);
    expect(document.querySelector('textarea[aria-label="Question"]')).toBeNull();
  });

  it('hides the action buttons once the recipient is done', () => {
    const fixture = render();
    fixture.componentInstance.isDone.set(true);
    fixture.detectChanges();

    expect(buttonByText('Decline Signing')).toBeUndefined();
    expect(buttonByText('Finish Later')).toBeUndefined();
  });

  it('renders organization branding links, with plain text when powered-by has no URL', () => {
    const fixture = render();
    fixture.componentInstance.organization.set({
      powered_by_label: 'Powered by Verdocs',
      powered_by_url: 'https://verdocs.com',
      terms_use_url: 'https://fake.test/terms',
      privacy_policy_url: 'https://fake.test/privacy',
    });
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      'https://verdocs.com',
      'https://fake.test/terms',
      'https://fake.test/privacy',
    ]);

    fixture.componentInstance.organization.set({ powered_by_label: 'Powered by Verdocs' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Powered by Verdocs');
  });
});
