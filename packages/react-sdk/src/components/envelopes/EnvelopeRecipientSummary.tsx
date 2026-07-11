import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { TRecipientStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import { formatFullName, getInPersonLink, getRecipientsWithActions, recipientCanAct } from '@verdocs/js-sdk';
import type { IEnvelopeEvent } from '../VerdocsEnvelopesList/VerdocsEnvelopesList';
import { useResolvedEndpoint } from '../../provider/VerdocsContext';
import ComponentError from '../../controls/ComponentError';
import { useEnvelope } from '../../hooks/useEnvelopes';
import { showToast } from '../../utils/toast';
import Button from '../../controls/Button';
import { SDKError } from '../../types';

export interface EnvelopeRecipientSummaryProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The envelope to summarize. */
  envelopeId: string;
  /** Enable or disable the Send Another button. */
  canSendAnother?: boolean;
  /** Enable or disable the View button. */
  canView?: boolean;
  /** Enable or disable the Done button. */
  canDone?: boolean;
  /** Called when the user clicks Send Another. The host should route to its send flow. */
  onAnother?: (event: IEnvelopeEvent) => void;
  /** Called when the user clicks View Now. The host should route to its envelope view. */
  onView?: (event: IEnvelopeEvent) => void;
  /** Called when the user clicks Done. The host should route to its next workflow step. */
  onDone?: (event: IEnvelopeEvent) => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

const STATUS_CLASSES: Partial<Record<TRecipientStatus, string>> = {
  invited: 'vdocs:bg-[#ff8f00]',
  signed: 'vdocs:bg-success',
  submitted: 'vdocs:bg-success',
  pending: 'vdocs:bg-info',
  canceled: 'vdocs:bg-danger',
  declined: 'vdocs:bg-danger',
};

function RecipientStatusChip({ status }: { status: TRecipientStatus }) {
  return (
    <div
      className={`vdocs:min-w-[100px] vdocs:rounded-[5px] vdocs:px-2 vdocs:py-[3px] vdocs:text-center vdocs:text-sm vdocs:capitalize vdocs:text-white ${STATUS_CLASSES[status] ?? 'vdocs:bg-muted'}`}>
      {status}
    </div>
  );
}

const toSdkError = (error: unknown) => {
  const e = error as { message: string; response?: { status?: number; data?: unknown } };
  return new SDKError(e.message, e.response?.status, e.response?.data);
};

/**
 * The post-send summary of an envelope's recipients: each role with its current
 * status, plus an in-person signing link fetcher for recipients who can act now.
 * The legacy component rendered as a full-screen overlay; this one renders as a
 * plain panel, so hosts that want the modal treatment can wrap it in a Dialog.
 */
export default function EnvelopeRecipientSummary({
  endpoint,
  envelopeId,
  canSendAnother = true,
  canView = true,
  canDone = true,
  onAnother,
  onView,
  onDone,
  onSdkError,
}: EnvelopeRecipientSummaryProps) {
  const resolvedEndpoint = useResolvedEndpoint(endpoint);
  const query = useEnvelope(envelopeId, endpoint);
  const [links, setLinks] = useState<Record<string, string>>({});

  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (query.error) {
      onSdkErrorRef.current?.(toSdkError(query.error));
    }
  }, [query.error]);

  const handleCopyLink = (link: string) => {
    navigator.clipboard
      .writeText(link)
      .then(() => showToast('Link copied to clipboard.', { style: 'success' }))
      .catch(error => {
        showToast('Unable to copy to the clipboard.', { style: 'error' });
        onSdkError?.(toSdkError(error));
      });
  };

  const linkMutation = useMutation({
    mutationFn: (roleName: string) => getInPersonLink(resolvedEndpoint, envelopeId, roleName),
    onSuccess: (response, roleName) => {
      setLinks(previous => ({ ...previous, [roleName]: response.link }));
      handleCopyLink(response.link);
    },
    onError: error => {
      showToast(`Unable to get link: ${(error as Error).message}`, { style: 'error' });
      onSdkError?.(toSdkError(error));
    },
  });

  const envelope = query.data;

  // The legacy component rendered nothing while loading. The summary is shown
  // right after a send, so the data is usually already cached anyway.
  if (query.isPending) {
    return null;
  }

  if (!envelope) {
    return <ComponentError message="Unable to load envelope. Please try again later." />;
  }

  const recipientsWithActions = getRecipientsWithActions(envelope);
  const sortedRecipients = [...(envelope.recipients ?? [])].sort((a, b) =>
    a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence);

  return (
    <div className="vdocs:flex vdocs:w-[600px] vdocs:max-w-full vdocs:flex-col vdocs:rounded-md vdocs:bg-surface vdocs:px-5 vdocs:pt-[30px] vdocs:pb-5 vdocs:font-sans vdocs:box-border">
      <h1 className="vdocs:m-0 vdocs:mb-2.5 vdocs:text-xl vdocs:font-bold vdocs:text-ink">
        Recipient Summary
      </h1>

      <div>
        {sortedRecipients.map(recipient => {
          const showLinkButton = recipientCanAct(recipient, recipientsWithActions);
          const link = links[recipient.role_name];
          const gettingLink = linkMutation.isPending && linkMutation.variables === recipient.role_name;
          const fullName = formatFullName(recipient);

          return (
            <div key={recipient.role_name} className="vdocs:mt-2 vdocs:mb-6 vdocs:flex vdocs:flex-col vdocs:text-muted">
              <div className="vdocs:mb-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
                <div className="vdocs:flex-1 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">
                  {recipient.role_name}
                </div>
                <RecipientStatusChip status={recipient.status} />
              </div>

              <div className="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-[5px]">
                <div className="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:truncate vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
                  {`${fullName} (${recipient.email || recipient.phone})`}
                </div>
                {showLinkButton && !link && (
                  <Button
                    size="small"
                    variant="outline"
                    label="Get Link"
                    disabled={gettingLink}
                    onClick={() => linkMutation.mutate(recipient.role_name)}
                  />
                )}
              </div>

              {link && (
                <div className="vdocs:mt-1 vdocs:flex vdocs:flex-row vdocs:gap-[5px]">
                  <div className="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:overflow-hidden vdocs:truncate vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
                    {link}
                  </div>
                  <Button size="small" variant="outline" label="Copy" onClick={() => handleCopyLink(link)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(canSendAnother || canView || canDone) && (
        <div className="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:gap-[15px]">
          {canSendAnother && (
            <Button size="small" label="Send Another" className="vdocs:min-w-[120px]" onClick={() => onAnother?.({ endpoint: resolvedEndpoint, envelope })} />
          )}
          {canView && (
            <Button size="small" label="View Now" className="vdocs:min-w-[120px]" onClick={() => onView?.({ endpoint: resolvedEndpoint, envelope })} />
          )}
          {canDone && (
            <Button size="small" label="Done" className="vdocs:min-w-[120px]" onClick={() => onDone?.({ endpoint: resolvedEndpoint, envelope })} />
          )}
        </div>
      )}
    </div>
  );
}
