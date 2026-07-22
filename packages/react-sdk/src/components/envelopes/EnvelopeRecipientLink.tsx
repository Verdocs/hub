import { formatFullName } from '@verdocs/js-sdk';
import type { IRecipient } from '@verdocs/js-sdk';
import { showToast } from '../../utils/toast';
import Button from '../../controls/Button';

export interface EnvelopeRecipientLinkProps {
  /** The recipient to display. */
  recipient: IRecipient;
  /** The recipient's in-person signing link, once the host has obtained one. */
  link?: string;
  /** True while the host is fetching the link. Shown as a loading state on the Get Link button. */
  gettingLink?: boolean;
  /** Called when the user clicks Get Link. The host fetches the link and re-renders with it set. */
  onGetLink?: (recipient: IRecipient) => void;
  /** Called when the user clicks Done to proceed to the next workflow step. */
  onDone?: () => void;
}

/**
 * Display a single recipient from an envelope, with the opportunity to copy an
 * in-person signing link for that recipient to use. The link itself is fetched
 * by the host (see `onGetLink`); copying writes it to the clipboard.
 */
export default function EnvelopeRecipientLink({ recipient, link, gettingLink = false, onGetLink, onDone }: EnvelopeRecipientLinkProps) {
  const handleCopy = () => {
    // Browsers block writes that aren't triggered by a user gesture, which is
    // why the copy happens here rather than automatically when the link loads.
    navigator.clipboard
      .writeText(link ?? '')
      .then(() => showToast('Link copied to clipboard!', { style: 'success', duration: 3000 }))
      .catch((e: Error) => showToast(`Unable to copy to clipboard: ${e.message}`, { style: 'error' }));
  };

  const fullName = formatFullName(recipient);

  return (
    <div className="vdocs:flex vdocs:flex-col vdocs:w-[600px] vdocs:max-w-full vdocs:font-sans vdocs:text-lg vdocs:bg-surface vdocs:rounded-md vdocs:pt-7 vdocs:px-5 vdocs:pb-5">
      <div className="vdocs:text-xl vdocs:font-bold vdocs:text-ink vdocs:mb-2.5">
        In-Person Signing Link
      </div>

      <div className="vdocs:flex vdocs:flex-col vdocs:text-ink vdocs:mt-2 vdocs:mb-6">
        <div className="vdocs:text-sm vdocs:font-semibold vdocs:mb-2">
          {recipient.role_name}
        </div>

        <div className="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-1.5">
          <div className="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:h-[34px] vdocs:px-3 vdocs:text-base vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas">
            {fullName}
            {' '}
            (
            {recipient.email || recipient.phone}
            )
          </div>

          {!link && (
            <Button
              size="small"
              variant="outline"
              label={gettingLink ? 'Loading...' : 'Get Link'}
              disabled={gettingLink}
              onClick={() => onGetLink?.(recipient)}
            />
          )}
        </div>

        {link && (
          <div className="vdocs:flex vdocs:flex-row vdocs:gap-1.5 vdocs:mt-1">
            <div className="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:h-[34px] vdocs:px-3 vdocs:text-base vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
              {link}
            </div>
            <Button size="small" variant="outline" label="Copy" onClick={handleCopy} />
          </div>
        )}
      </div>

      <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:mt-2.5">
        <Button size="small" label="Done" className="vdocs:min-w-[120px]" onClick={() => onDone?.()} />
      </div>
    </div>
  );
}
