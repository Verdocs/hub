import { useState } from 'react';
import TextInput from '../controls/TextInput';
import Button from '../controls/Button';
import Dialog from './Dialog';

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

export interface DelegateDialogProps {
  /** Fired when the user submits the delegation details. The sign embed wires this to the delegation endpoint. */
  onDelegate?: (details: IDelegateDetails) => void;
  /** Fired when the user cancels via the Cancel button, the close control, or the overlay. */
  onCancel?: () => void;
}

/**
 * Collect the details needed to delegate signing responsibility to someone else. Purely
 * presentational: the sign embed wires onDelegate to the delegation endpoint and closes
 * the dialog when the request completes.
 */
export default function DelegateDialog({ onDelegate, onCancel }: DelegateDialogProps) {
  const [details, setDetails] = useState<IDelegateDetails>({ first_name: '', last_name: '', email: '', phone: '', message: '' });

  const handleFieldChange = (field: keyof IDelegateDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const canDelegate = !!details.first_name && !!details.last_name && !!details.email;

  return (
    <Dialog
      heading="Delegate Signing"
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:justify-end vdocs:gap-4">
          <Button label="Cancel" variant="outline" onClick={() => onCancel?.()} />
          <Button label="Delegate" disabled={!canDelegate} onClick={() => onDelegate?.(details)} />
        </div>
      )}>
      <div className="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
        New Recipient:
        <span className="vdocs:text-danger">*</span>
      </div>
      <div className="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
        <TextInput
          aria-label="First name"
          placeholder="First name"
          value={details.first_name}
          onChange={e => handleFieldChange('first_name', e.target.value)}
        />
        <TextInput
          aria-label="Last name"
          placeholder="Last name"
          value={details.last_name}
          onChange={e => handleFieldChange('last_name', e.target.value)}
        />
      </div>

      <TextInput
        label="Email Address"
        required
        type="email"
        placeholder="New recipient email address"
        value={details.email}
        onChange={e => handleFieldChange('email', e.target.value)}
      />

      <TextInput
        label="Phone Number"
        type="tel"
        placeholder="Optional phone number"
        value={details.phone}
        onChange={e => handleFieldChange('phone', e.target.value)}
      />

      <label className="vdocs:block vdocs:font-sans">
        <div className="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          Message (optional)
        </div>
        <textarea
          rows={3}
          placeholder="Type message here..."
          value={details.message}
          onChange={e => handleFieldChange('message', e.target.value)}
          className="vdocs:w-full vdocs:px-2.5 vdocs:py-2 vdocs:text-sm vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:resize-y vdocs:focus:border-accent"
        />
      </label>
    </Dialog>
  );
}
