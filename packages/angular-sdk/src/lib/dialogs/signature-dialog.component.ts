import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VerdocsAdoptSignatureDialogComponent, type IAdoptedSignature } from './adopt-signature-dialog.component';

/**
 * The dialog the signing flow opens when a recipient reaches a signature field
 * without an adopted signature. A thin composition of the adopt-signature dialog
 * in its signature variant: the user types or draws a signature and the rendered
 * PNG comes back through the adopted event as a data URL (React's onAdopt;
 * onCancel is the cancel output).
 *
 * Purely presentational: persisting the image (createSignature in js-sdk) and
 * writing it to the field are the caller's job, from the adopted event.
 */
@Component({
  selector: 'verdocs-signature-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsAdoptSignatureDialogComponent ],
  template: `<verdocs-adopt-signature-dialog [fullName]="fullName()" (adopted)="adopted.emit($event)" (cancel)="cancel.emit()" />`,
})
export class VerdocsSignatureDialogComponent {
  /** Seeds the Full Name input, typically the recipient's name. */
  readonly fullName = input('');

  /** Emitted with the adopted signature image when the user clicks Adopt & Sign. */
  readonly adopted = output<IAdoptedSignature>();
  /** Emitted when the user cancels or dismisses the dialog. */
  readonly cancel = output<void>();
}
