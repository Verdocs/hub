import { useState } from 'react';
import TextInput from '../controls/TextInput';
import Button from '../controls/Button';
import Dialog from './Dialog';

export interface PasscodeDialogProps {
  /** Displayed below the input in the danger color, typically after the verification endpoint rejects the passcode. */
  error?: string;
  /** Fired when the user submits the passcode they entered. The input clears for the next attempt. */
  onSubmit?: (code: string) => void;
  /** Fired when the user cancels via the Cancel button or the close control. */
  onCancel?: () => void;
}

/**
 * Prompt the signer for the passcode protecting an envelope. Purely presentational: the
 * sign embed wires onSubmit to the signer verification endpoint and reports a rejected
 * passcode back through the error prop.
 */
export default function PasscodeDialog({ error, onSubmit, onCancel }: PasscodeDialogProps) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    onSubmit?.(code);
    setCode('');
  };

  return (
    <Dialog
      heading="Passcode Required"
      persistent
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:justify-end vdocs:gap-4">
          <Button label="Cancel" variant="outline" onClick={() => onCancel?.()} />
          <Button label="Submit" disabled={!code} onClick={handleSubmit} />
        </div>
      )}>
      <p className="vdocs:mt-0 vdocs:mb-5">
        This document is protected by a passcode. Please enter it below to proceed. If you do not have one, please contact the sender.
      </p>

      <TextInput placeholder="Enter passcode..." value={code} onChange={e => setCode(e.target.value)} />

      {error && (
        <div role="alert" className="vdocs:mt-2 vdocs:text-sm vdocs:text-danger">
          {error}
        </div>
      )}
    </Dialog>
  );
}
