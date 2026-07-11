import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { VerdocsTextInputComponent } from '../controls/text-input.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

const RESEND_COOLDOWN_MS = 30000;

/**
 * Prompt the signer for the one-time code that was sent to them via email or SMS.
 * Purely presentational: the sign embed sends the initial code when it opens this
 * dialog, wires submit and resend to the signer verification endpoint, and reports
 * a rejected code back through the error input. React's onSubmit/onResend/onCancel
 * callbacks are this component's submit, resend, and cancel outputs.
 */
@Component({
  selector: 'verdocs-otp-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent, VerdocsTextInputComponent ],
  template: `
    <verdocs-dialog heading="Verification Required" [persistent]="true" [footer]="footerTpl" (closed)="cancel.emit()">
      <p class="vdocs:mt-0 vdocs:mb-5">
        Please check your messages for a one-time code. If you did not receive it, be sure to check your Spam/Junk folder.
      </p>

      <verdocs-text-input placeholder="Enter your one-time code..." [(value)]="code" />

      @if (error()) {
        <div role="alert" class="vdocs:mt-2 vdocs:text-sm vdocs:text-danger">{{ error() }}</div>
      }
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <verdocs-button label="Cancel" variant="outline" (click)="cancel.emit()" />
        <verdocs-button label="Resend" [disabled]="resendDisabled()" (click)="onResend()" />
        <verdocs-button label="Submit" [disabled]="!code()" (click)="onSubmit()" />
      </div>
    </ng-template>
  `,
})
export class VerdocsOtpDialogComponent {
  /** Displayed below the input in the danger color, typically after the verification endpoint rejects a code. */
  readonly error = input('');

  /** Emitted when the user submits the code they entered. The input clears for the next attempt. */
  readonly submit = output<string>();
  /** Emitted when the user requests a new code. Locked for 30 seconds after opening, resending, or submitting. */
  readonly resend = output<void>();
  /** Emitted when the user cancels via the Cancel button or the close control. */
  readonly cancel = output<void>();

  protected readonly code = signal('');
  protected readonly resendDisabled = signal(true);

  private cooldownTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // The legacy dialog locked the resend button for 30 seconds at a time to keep signers from
    // flooding themselves with codes. The lockout starts on mount (the embed sends the first
    // code when it opens this dialog) and restarts after every resend or submit.
    this.startCooldown();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.cooldownTimer));
  }

  private startCooldown() {
    this.resendDisabled.set(true);
    clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => this.resendDisabled.set(false), RESEND_COOLDOWN_MS);
  }

  protected onResend() {
    this.code.set('');
    this.startCooldown();
    this.resend.emit();
  }

  protected onSubmit() {
    this.submit.emit(this.code());
    this.code.set('');
    this.startCooldown();
  }
}
