import { Button } from '@verdocs/react-sdk';

export interface SignerFooterProps {
  /** How many required fields are still incomplete. */
  remaining: number;
  /** Called when the user clicks Next (or Finish once nothing remains). */
  onNext: () => void;
  /** Called when the user clicks Decline. */
  onDecline: () => void;
}

/**
 * Fixed footer for the signing ceremony: decline on the left, static zoom
 * controls in the middle, and the primary Next/Finish action on the right.
 */
export default function SignerFooter({ remaining, onNext, onDecline }: SignerFooterProps) {
  return (
    <footer className="signer-footer">
      <button type="button" className="decline-link" onClick={onDecline}>
        Decline to sign
      </button>

      <div className="footer-controls">
        <div className="zoom-group" aria-label="Zoom">
          <button type="button" className="zoom-btn" aria-label="Zoom out">
            -
          </button>
          <span className="zoom-level">
            100%
          </span>
          <button type="button" className="zoom-btn" aria-label="Zoom in">
            +
          </button>
        </div>
        <span className="page-indicator">
          Page 1 of 1
        </span>
      </div>

      <div className="footer-next">
        <span className="remaining-label">
          {remaining > 0 ? `${remaining} required field${remaining === 1 ? '' : 's'} left` : 'Ready to submit'}
        </span>
        <Button label={remaining > 0 ? 'Next' : 'Finish'} size="small" onClick={onNext} />
      </div>
    </footer>
  );
}
