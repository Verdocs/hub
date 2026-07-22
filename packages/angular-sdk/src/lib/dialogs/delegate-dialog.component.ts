import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { VerdocsTextInputComponent } from '../controls/text-input.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

export interface IDelegateDetails {
  /** The new recipient's first name. */
  first_name: string;
  /** The new recipient's last name. */
  last_name: string;
  /** The new recipient's email address. The signing invite goes here. */
  email: string;
  /** Optional phone number for SMS invites. */
  phone: string;
  /** Optional message to include in the invite. */
  message: string;
}

/**
 * Collect the details needed to delegate signing responsibility to someone else.
 * Purely presentational: the sign embed wires the delegate event to the delegation
 * endpoint and closes the dialog when the request completes. React's
 * onDelegate/onCancel callbacks are this component's delegate and cancel outputs.
 */
@Component({
  selector: 'verdocs-delegate-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent, VerdocsTextInputComponent ],
  template: `
    <verdocs-dialog heading="Delegate Signing" [footer]="footerTpl" (closed)="cancel.emit()">
      <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
        New Recipient:<span class="vdocs:text-danger">*</span>
      </div>
      <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
        <verdocs-text-input placeholder="First name" [value]="details().first_name" (valueChange)="setDetail('first_name', $event)" />
        <verdocs-text-input placeholder="Last name" [value]="details().last_name" (valueChange)="setDetail('last_name', $event)" />
      </div>

      <verdocs-text-input
        label="Email Address"
        [required]="true"
        type="email"
        placeholder="New recipient email address"
        [value]="details().email"
        (valueChange)="setDetail('email', $event)" />

      <verdocs-text-input
        label="Phone Number"
        type="tel"
        placeholder="Optional phone number"
        [value]="details().phone"
        (valueChange)="setDetail('phone', $event)" />

      <label class="vdocs:block vdocs:font-sans">
        <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">Message (optional)</div>
        <textarea
          rows="3"
          placeholder="Type message here..."
          [value]="details().message"
          (input)="onMessageInput($event)"
          class="vdocs:w-full vdocs:px-2.5 vdocs:py-2 vdocs:text-sm vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:resize-y vdocs:focus:border-accent"></textarea>
      </label>
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <verdocs-button label="Cancel" variant="outline" (click)="cancel.emit()" />
        <verdocs-button label="Delegate" [disabled]="!canDelegate()" (click)="delegate.emit(details())" />
      </div>
    </ng-template>
  `,
})
export class VerdocsDelegateDialogComponent {
  /** Emitted when the user submits the delegation details. The sign embed wires this to the delegation endpoint. */
  readonly delegate = output<IDelegateDetails>();
  /** Emitted when the user cancels via the Cancel button, the close control, or the overlay. */
  readonly cancel = output<void>();

  protected readonly details = signal<IDelegateDetails>({ first_name: '', last_name: '', email: '', phone: '', message: '' });

  protected readonly canDelegate = computed(() => {
    const details = this.details();
    return !!details.first_name && !!details.last_name && !!details.email;
  });

  protected setDetail(field: keyof IDelegateDetails, value: string) {
    this.details.update(prev => ({ ...prev, [field]: value }));
  }

  protected onMessageInput(event: Event) {
    this.setDetail('message', (event.target as HTMLTextAreaElement).value);
  }
}
