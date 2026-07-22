import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { VerdocsTextInputComponent } from '../controls/text-input.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

/**
 * Prompt the signer for the passcode protecting an envelope. Purely presentational:
 * the sign embed wires submit to the signer verification endpoint and reports a
 * rejected passcode back through the error input. React's onSubmit/onCancel
 * callbacks are this component's submit and cancel outputs.
 */
@Component({
  selector: 'verdocs-passcode-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent, VerdocsTextInputComponent ],
  template: `
    <verdocs-dialog heading="Passcode Required" [persistent]="true" [footer]="footerTpl" (closed)="cancel.emit()">
      <p class="vdocs:mt-0 vdocs:mb-5">
        This document is protected by a passcode. Please enter it below to proceed. If you do not have one, please contact the sender.
      </p>

      <verdocs-text-input placeholder="Enter passcode..." [(value)]="code" />

      @if (error()) {
        <div role="alert" class="vdocs:mt-2 vdocs:text-sm vdocs:text-danger">{{ error() }}</div>
      }
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <verdocs-button label="Cancel" variant="outline" (click)="cancel.emit()" />
        <verdocs-button label="Submit" [disabled]="!code()" (click)="onSubmit()" />
      </div>
    </ng-template>
  `,
})
export class VerdocsPasscodeDialogComponent {
  /** Displayed below the input in the danger color, typically after the verification endpoint rejects the passcode. */
  readonly error = input('');

  /** Emitted when the user submits the passcode they entered. The input clears for the next attempt. */
  readonly submit = output<string>();
  /** Emitted when the user cancels via the Cancel button or the close control. */
  readonly cancel = output<void>();

  protected readonly code = signal('');

  protected onSubmit() {
    this.submit.emit(this.code());
    this.code.set('');
  }
}
