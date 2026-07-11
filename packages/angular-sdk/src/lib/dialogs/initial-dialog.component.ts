import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VerdocsAdoptSignatureDialogComponent, type IAdoptedSignature } from './adopt-signature-dialog.component';

/**
 * The initials counterpart to the signature dialog: a thin composition of the
 * adopt-signature dialog in its initials variant, with initials labels and a
 * half-width preview. The adopted PNG comes back through the adopted event as a
 * data URL, with the entered initials in the payload's fullName field (React's
 * onAdopt; onCancel is the cancel output).
 *
 * Purely presentational: persisting the image (createInitials in js-sdk) and
 * writing it to the field are the caller's job, from the adopted event.
 */
@Component({
  selector: 'verdocs-initial-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsAdoptSignatureDialogComponent ],
  template: `<verdocs-adopt-signature-dialog variant="initials" [fullName]="initials()" (adopted)="adopted.emit($event)" (cancel)="cancel.emit()" />`,
})
export class VerdocsInitialDialogComponent {
  /** Seeds the Initials input. Displayed uppercased, matching the legacy dialog. */
  readonly initials = input('');

  /** Emitted with the adopted initials image when the user clicks Adopt & Sign. */
  readonly adopted = output<IAdoptedSignature>();
  /** Emitted when the user cancels or dismisses the dialog. */
  readonly cancel = output<void>();
}
