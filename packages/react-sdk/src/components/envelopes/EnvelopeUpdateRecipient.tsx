import { updateRecipient } from '@verdocs/js-sdk';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IRecipient, IUpdateRecipientParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../../provider/VerdocsContext';
import { useEnvelope } from '../../hooks/useEnvelopes';
import TextInput from '../../controls/TextInput';
import { showToast } from '../../utils/toast';
import Button from '../../controls/Button';
import Dialog from '../../dialogs/Dialog';
import { SDKError } from '../../types';

export interface EnvelopeUpdateRecipientProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The envelope containing the recipient to update. */
  envelopeId: string;
  /** The role name of the recipient to update. */
  roleName: string;
  /** Called after the recipient is successfully updated, with the updated recipient. */
  onUpdated?: (recipient: IRecipient) => void;
  /** Called when the user dismisses the dialog without saving any changes. */
  onCancel?: () => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

const toSdkError = (error: unknown) => {
  const e = error as { message: string; response?: { status?: number; data?: unknown } };
  return new SDKError(e.message, e.response?.status, e.response?.data);
};

/**
 * A dialog for updating a recipient's contact details (name, email, phone, and
 * invite message) before they act. Only the fields that actually changed are
 * submitted, and the envelope's detail query is invalidated after a save so any
 * mounted views refresh. Render conditionally and unmount in onUpdated/onCancel.
 */
export default function EnvelopeUpdateRecipient({
  endpoint,
  envelopeId,
  roleName,
  onUpdated,
  onCancel,
  onSdkError,
}: EnvelopeUpdateRecipientProps) {
  const resolvedEndpoint = useResolvedEndpoint(endpoint);
  const queryClient = useQueryClient();
  const query = useEnvelope(envelopeId, endpoint);

  // Edit buffers overlay the loaded recipient: null means untouched, so the
  // form tracks the server data until the user starts typing in a field.
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (query.error) {
      onSdkErrorRef.current?.(toSdkError(query.error));
    }
  }, [query.error]);

  const updateMutation = useMutation({
    mutationFn: (params: IUpdateRecipientParams) => updateRecipient(resolvedEndpoint, envelopeId, roleName, params),
    onSuccess: updated => {
      showToast('Recipient updated', { style: 'success' });
      onUpdated?.(updated);
      return queryClient.invalidateQueries({ queryKey: ['envelopes', envelopeId] });
    },
    onError: error => {
      showToast(`Error updating recipient: ${(error as Error).message}`, { style: 'error' });
      onSdkError?.(toSdkError(error));
    },
  });

  const recipient = (query.data?.recipients ?? []).find(r => r.role_name === roleName);

  // The legacy component rendered nothing until the envelope loaded, to avoid
  // flashing an empty dialog.
  if (!recipient) {
    return null;
  }

  const handleSave = () => {
    const fields: IUpdateRecipientParams = {};
    if (firstName !== null && firstName !== recipient.first_name) {
      fields.first_name = firstName;
    }
    if (lastName !== null && lastName !== recipient.last_name) {
      fields.last_name = lastName;
    }
    if (email !== null && email !== recipient.email) {
      fields.email = email;
    }
    if (phone !== null && phone !== (recipient.phone ?? '')) {
      fields.phone = phone;
    }
    if (message !== null && message !== (recipient.message ?? '')) {
      fields.message = message;
    }

    // Nothing changed, so skip the request. The server sends a fresh invite on
    // some updates and we don't want to trigger that for a no-op save.
    if (Object.keys(fields).length < 1) {
      onCancel?.();
      return;
    }

    updateMutation.mutate(fields);
  };

  return (
    <Dialog
      heading="Update Recipient"
      onClose={() => onCancel?.()}
      footer={(
        <div className="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
          <Button label="Cancel" variant="outline" size="small" disabled={updateMutation.isPending} onClick={() => onCancel?.()} />
          <Button label="Save" size="small" disabled={updateMutation.isPending} onClick={handleSave} />
        </div>
      )}>
      <div className="vdocs:mb-2 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">
        {roleName}
      </div>

      <div className="vdocs:flex vdocs:flex-row vdocs:gap-3">
        <TextInput
          aria-label="First Name"
          placeholder="First Name..."
          className="vdocs:flex-1"
          value={firstName ?? recipient.first_name ?? ''}
          onChange={e => setFirstName(e.target.value)}
        />
        <TextInput
          aria-label="Last Name"
          placeholder="Last Name..."
          className="vdocs:flex-1"
          value={lastName ?? recipient.last_name ?? ''}
          onChange={e => setLastName(e.target.value)}
        />
      </div>

      <TextInput
        type="email"
        aria-label="Email Address"
        placeholder="Email Address..."
        value={email ?? recipient.email ?? ''}
        onChange={e => setEmail(e.target.value)}
      />

      <TextInput
        type="tel"
        aria-label="Phone Number"
        placeholder="Phone Number..."
        value={phone ?? recipient.phone ?? ''}
        onChange={e => setPhone(e.target.value)}
      />

      <textarea
        rows={3}
        aria-label="Invitation Message"
        placeholder="Optional message to include in invitation..."
        data-lpignore="true"
        value={message ?? recipient.message ?? ''}
        onChange={e => setMessage(e.target.value)}
        className="vdocs:box-border vdocs:w-full vdocs:resize-y vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface vdocs:p-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none vdocs:focus:border-accent"
      />

      <div className="vdocs:mt-2 vdocs:text-sm vdocs:italic vdocs:text-muted">
        NOTE: If you change the recipient&apos;s email address or invite message, they will receive a
        new invitation to sign the envelope. This will also reset their status if they have previously
        declined to sign.
      </div>
    </Dialog>
  );
}
