import AdoptSignatureDialog, { type IAdoptedSignature } from './AdoptSignatureDialog';

export interface InitialDialogProps {
  /** Seeds the Initials input. Displayed uppercased, matching the legacy dialog. */
  initials?: string;
  /** Called with the adopted initials image when the user clicks Adopt & Sign. */
  onAdopt?: (adopted: IAdoptedSignature) => void;
  /** Called when the user cancels or dismisses the dialog. */
  onCancel?: () => void;
}

/**
 * The initials counterpart to SignatureDialog: a thin composition of
 * AdoptSignatureDialog in its initials variant, with initials labels and a
 * half-width preview. The adopted PNG comes back through onAdopt as a data
 * URL, with the entered initials in the payload's fullName field.
 *
 * Purely presentational: persisting the image (createInitials in js-sdk) and
 * writing it to the field are the caller's job, inside onAdopt.
 */
export default function InitialDialog({ initials, onAdopt, onCancel }: InitialDialogProps) {
  return <AdoptSignatureDialog variant="initials" fullName={initials} onAdopt={onAdopt} onCancel={onCancel} />;
}
