import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

/**
 * Prompts a signer to type a question for the envelope's sender. Purely
 * presentational: the caller mounts it conditionally, removes it from the
 * submit and cancel events, and wires submit to whatever actually delivers
 * the question. React's onSubmit/onCancel callbacks are this component's
 * submit and cancel outputs.
 */
@Component({
  selector: 'verdocs-question-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent ],
  template: `
    <verdocs-dialog heading="Ask the Sender a Question" [footer]="footerTpl" (closed)="cancel.emit()">
      <textarea
        rows="6"
        aria-label="Question"
        placeholder="Enter your question..."
        [value]="entered()"
        (input)="onInput($event)"
        class="vdocs:w-full vdocs:box-border vdocs:resize-y vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:p-2.5 vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent"></textarea>
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
        <verdocs-button label="Cancel" variant="outline" class="vdocs:flex-1" (click)="cancel.emit()" />
        <verdocs-button label="OK" class="vdocs:flex-1" (click)="submit.emit(entered())" />
      </div>
    </ng-template>
  `,
})
export class VerdocsQuestionDialogComponent {
  /** Initial content for the question box, e.g. a draft the user previously typed. */
  readonly question = input('');

  /** Emitted with the entered text when the user clicks OK. The caller delivers the question to the sender. */
  readonly submit = output<string>();
  /** Emitted when the user clicks Cancel, the close button, or the background overlay. */
  readonly cancel = output<void>();

  protected readonly entered = linkedSignal(() => this.question());

  protected onInput(event: Event) {
    this.entered.set((event.target as HTMLTextAreaElement).value);
  }
}
