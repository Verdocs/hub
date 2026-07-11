import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal, TemplateRef } from '@angular/core';
import { VerdocsCheckboxComponent } from '../controls/checkbox.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

/**
 * The e-signature disclosures and consent gate shown before signing begins.
 * Proceed stays disabled until the signer checks the acceptance box; Decline
 * (and Delegate, when enabled) are always available. Purely presentational:
 * the caller records the outcome when an event fires. React's
 * onAgree/onDecline/onDelegate/onCancel callbacks are this component's agree,
 * decline, delegate, and cancel outputs, and the ReactNode disclosures prop is
 * a TemplateRef input here.
 */
@Component({
  selector: 'verdocs-disclosure-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ NgTemplateOutlet, VerdocsDialogComponent, VerdocsButtonComponent, VerdocsCheckboxComponent ],
  template: `
    <verdocs-dialog heading="e-Signature Disclosures" [footer]="footerTpl" (closed)="cancel.emit()">
      @if (disclosures(); as tpl) {
        <ng-container [ngTemplateOutlet]="tpl" />
      } @else {
        <!-- Mirrors DEFAULT_DISCLOSURES in js-sdk, which the platform only overrides at the
             organization level. Callers with custom disclosures pass their own template. -->
        <ul class="vdocs:m-0 vdocs:mb-4 vdocs:list-none vdocs:p-0">
          <li class="vdocs:relative vdocs:mb-3 vdocs:pl-[34px] vdocs:text-sm vdocs:leading-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="vdocs:absolute vdocs:-top-0.5 vdocs:left-0 vdocs:size-6 vdocs:text-muted"
              aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Agree to use electronic records and signatures, and confirm you have read the
            <a href="https://verdocs.com/en/electronic-record-signature-disclosure/" target="_blank" rel="noreferrer" class="vdocs:text-accent">Electronic Record and Signatures Disclosure</a>.
          </li>
          <li class="vdocs:relative vdocs:mb-3 vdocs:pl-[34px] vdocs:text-sm vdocs:leading-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="vdocs:absolute vdocs:-top-0.5 vdocs:left-0 vdocs:size-6 vdocs:text-muted"
              aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Agree to Verdocs' <a href="https://verdocs.com/en/eula" target="_blank" rel="noreferrer" class="vdocs:text-accent">End User License Agreement</a>
            and confirm you have read Verdocs' <a href="https://verdocs.com/en/privacy-policy/" target="_blank" rel="noreferrer" class="vdocs:text-accent">Privacy Policy</a>.
          </li>
        </ul>
      }

      <div class="vdocs:mt-4">
        <verdocs-checkbox
          label="I accept the electronic signature disclosures and agree to proceed with digital signing."
          [(checked)]="accepted" />
      </div>
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-3">
        <verdocs-button label="Decline" variant="outline" class="vdocs:mr-auto" (click)="decline.emit()" />
        @if (delegator()) {
          <verdocs-button label="Delegate" variant="outline" (click)="delegate.emit()" />
        }
        <verdocs-button label="Proceed" [disabled]="!accepted()" (click)="agree.emit()" />
      </div>
    </ng-template>
  `,
})
export class VerdocsDisclosureDialogComponent {
  /** The disclosure content to display. Defaults to the standard Verdocs disclosures. */
  readonly disclosures = input<TemplateRef<void> | null>(null);
  /** If true, a Delegate button is included so the recipient can reassign signing. */
  readonly delegator = input(false);

  /** Emitted when the user accepts the disclosures and chooses to proceed. */
  readonly agree = output<void>();
  /** Emitted when the user declines to sign. */
  readonly decline = output<void>();
  /** Emitted when the user chooses to delegate signing. Only reachable when delegator is true. */
  readonly delegate = output<void>();
  /** Emitted when the user dismisses the dialog via the overlay or the close button. */
  readonly cancel = output<void>();

  protected readonly accepted = signal(false);
}
