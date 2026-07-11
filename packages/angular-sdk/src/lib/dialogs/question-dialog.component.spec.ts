import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsQuestionDialogComponent } from './question-dialog.component';

describe('VerdocsQuestionDialogComponent', () => {
  @Component({
    imports: [ VerdocsQuestionDialogComponent ],
    template: `<verdocs-question-dialog [question]="question()" (submit)="submitted = $event" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    submitted: string | null = null;
    cancels = 0;
    question = signal('');
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label);
  const textarea = () => document.querySelector('textarea') as HTMLTextAreaElement;

  it('submits the typed question', async () => {
    const fixture = await createFixture();

    expect((document.querySelector('[role="dialog"]') as HTMLElement).textContent).toContain('Ask the Sender a Question');

    textarea().value = 'What is the deadline?';
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByLabel('OK')?.click();
    expect(fixture.componentInstance.submitted).toBe('What is the deadline?');
    expect(fixture.componentInstance.cancels).toBe(0);
  });

  it('prefills the question box and cancels without submitting', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.question.set('Draft question');
    fixture.detectChanges();

    expect(textarea().value).toBe('Draft question');

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);
    expect(fixture.componentInstance.submitted).toBeNull();
  });

  it('treats dismissal as a cancel', async () => {
    const fixture = await createFixture();

    (document.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
