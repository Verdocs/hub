import { useState, type ReactNode } from 'react';
import CheckIcon from '../controls/icons/CheckIcon';
import Checkbox from '../controls/Checkbox';
import Button from '../controls/Button';
import Dialog from './Dialog';

function DisclosureLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="vdocs:text-accent">
      {children}
    </a>
  );
}

function DisclosureItem({ children }: { children: ReactNode }) {
  return (
    <li className="vdocs:relative vdocs:mb-3 vdocs:pl-[34px] vdocs:text-sm vdocs:leading-5">
      <CheckIcon className="vdocs:absolute vdocs:-top-0.5 vdocs:left-0 vdocs:size-6 vdocs:text-muted" />
      {children}
    </li>
  );
}

// Mirrors DEFAULT_DISCLOSURES in js-sdk, which the platform only overrides at the
// organization level. Callers with custom disclosures pass their own content.
const DEFAULT_DISCLOSURE_CONTENT = (
  <ul className="vdocs:m-0 vdocs:mb-4 vdocs:list-none vdocs:p-0">
    <DisclosureItem>
      Agree to use electronic records and signatures, and confirm you have read the{' '}
      <DisclosureLink href="https://verdocs.com/en/electronic-record-signature-disclosure/">Electronic Record and Signatures Disclosure</DisclosureLink>.
    </DisclosureItem>
    <DisclosureItem>
      Agree to Verdocs&apos; <DisclosureLink href="https://verdocs.com/en/eula">End User License Agreement</DisclosureLink> and confirm you have read
      Verdocs&apos; <DisclosureLink href="https://verdocs.com/en/privacy-policy/">Privacy Policy</DisclosureLink>.
    </DisclosureItem>
  </ul>
);

export interface DisclosureDialogProps {
  /** The disclosure content to display. Defaults to the standard Verdocs disclosures. */
  disclosures?: ReactNode;
  /** If true, a Delegate button is included so the recipient can reassign signing. */
  delegator?: boolean;
  /** Fired when the user accepts the disclosures and chooses to proceed. */
  onAgree?: () => void;
  /** Fired when the user declines to sign. */
  onDecline?: () => void;
  /** Fired when the user chooses to delegate signing. Only reachable when delegator is true. */
  onDelegate?: () => void;
  /** Fired when the user dismisses the dialog via the overlay or the close button. */
  onCancel?: () => void;
}

/**
 * The e-signature disclosures and consent gate shown before signing begins.
 * Proceed stays disabled until the signer checks the acceptance box; Decline
 * (and Delegate, when enabled) are always available. Purely presentational:
 * the caller records the outcome when a callback fires.
 */
export default function DisclosureDialog({
  disclosures = DEFAULT_DISCLOSURE_CONTENT,
  delegator = false,
  onAgree,
  onDecline,
  onDelegate,
  onCancel,
}: DisclosureDialogProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog
      heading="e-Signature Disclosures"
      onClose={onCancel}
      footer={
        <div className="vdocs:flex vdocs:flex-row vdocs:gap-3">
          <Button label="Decline" variant="outline" className="vdocs:mr-auto" onClick={onDecline} />
          {delegator && <Button label="Delegate" variant="outline" onClick={onDelegate} />}
          <Button label="Proceed" disabled={!accepted} onClick={onAgree} />
        </div>
      }>
      {disclosures}

      <div className="vdocs:mt-4">
        <Checkbox
          label="I accept the electronic signature disclosures and agree to proceed with digital signing."
          checked={accepted}
          onChange={() => setAccepted(previous => !previous)}
        />
      </div>
    </Dialog>
  );
}
