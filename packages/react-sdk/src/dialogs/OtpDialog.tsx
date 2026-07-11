import { useEffect, useState } from 'react';
import TextInput from '../controls/TextInput';
import Button from '../controls/Button';
import Dialog from './Dialog';

const RESEND_COOLDOWN_MS = 30000;

export interface OtpDialogProps {
  /** Displayed below the input in the danger color, typically after the verification endpoint rejects a code. */
  error?: string;
  /** Fired when the user submits the code they entered. The input clears for the next attempt. */
  onSubmit?: (code: string) => void;
  /** Fired when the user requests a new code. Locked for 30 seconds after opening, resending, or submitting. */
  onResend?: () => void;
  /** Fired when the user cancels via the Cancel button or the close control. */
  onCancel?: () => void;
}

/**
 * Prompt the signer for the one-time code that was sent to them via email or SMS. Purely
 * presentational: the sign embed sends the initial code when it opens this dialog, wires
 * onSubmit and onResend to the signer verification endpoint, and reports a rejected code
 * back through the error prop.
 */
export default function OtpDialog({ error, onSubmit, onResend, onCancel }: OtpDialogProps) {
  const [code, setCode] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [cooldownsStarted, setCooldownsStarted] = useState(0);

  // The legacy dialog locked the resend button for 30 seconds at a time to keep signers from
  // flooding themselves with codes. The lockout starts on mount (the embed sends the first
  // code when it opens this dialog) and restarts after every resend or submit.
  useEffect(() => {
    setResendDisabled(true);
    const timer = setTimeout(() => setResendDisabled(false), RESEND_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [cooldownsStarted]);

  const handleResend = () => {
    setCode('');
    setCooldownsStarted(n => n + 1);
    onResend?.();
  };

  const handleSubmit = () => {
    onSubmit?.(code);
    setCode('');
    setCooldownsStarted(n => n + 1);
  };

  return (
    <Dialog
      heading="Verification Required"
      persistent
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:justify-end vdocs:gap-4">
          <Button label="Cancel" variant="outline" onClick={() => onCancel?.()} />
          <Button label="Resend" disabled={resendDisabled} onClick={handleResend} />
          <Button label="Submit" disabled={!code} onClick={handleSubmit} />
        </div>
      )}>
      <p className="vdocs:mt-0 vdocs:mb-5">
        Please check your messages for a one-time code. If you did not receive it, be sure to check your Spam/Junk folder.
      </p>

      <TextInput placeholder="Enter your one-time code..." value={code} onChange={e => setCode(e.target.value)} />

      {error && (
        <div role="alert" className="vdocs:mt-2 vdocs:text-sm vdocs:text-danger">
          {error}
        </div>
      )}
    </Dialog>
  );
}
