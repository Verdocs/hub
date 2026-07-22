import AdoptSignatureDialog, { type IAdoptedSignature } from './AdoptSignatureDialog';

export interface SignatureDialogProps {
  /** Seeds the Full Name input, typically the recipient's name. */
  fullName?: string;
  /** Called with the adopted signature image when the user clicks Adopt & Sign. */
  onAdopt?: (adopted: IAdoptedSignature) => void;
  /** Called when the user cancels or dismisses the dialog. */
  onCancel?: () => void;
}

/**
 * The dialog the signing flow opens when a recipient reaches a signature field
 * without an adopted signature. A thin composition of AdoptSignatureDialog in
 * its signature variant: the user types or draws a signature and the rendered
 * PNG comes back through onAdopt as a data URL.
 *
 * Purely presentational: persisting the image (createSignature in js-sdk) and
 * writing it to the field are the caller's job, inside onAdopt.
 */
export default function SignatureDialog({ fullName, onAdopt, onCancel }: SignatureDialogProps) {
  return <AdoptSignatureDialog fullName={fullName} onAdopt={onAdopt} onCancel={onCancel} />;
}
