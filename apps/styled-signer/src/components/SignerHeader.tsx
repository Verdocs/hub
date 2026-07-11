import { Button } from '@verdocs/react-sdk';
import type { BrandTheme } from '../theme/theme';
import BrandMark from './BrandMark';

export interface SignerHeaderProps {
  /** The active brand values, used for the logo and company name. */
  theme: BrandTheme;
  /** How many fields the signer has completed. */
  done: number;
  /** Total number of fields in the ceremony. */
  total: number;
  /** Called when the user clicks the Brand theme button. */
  onOpenTheme: () => void;
}

/**
 * Signing header: the customer's brand on the left, live progress on the
 * right. Everything is styled from the vdocs tokens so the theme dialog
 * restyles it live.
 */
export default function SignerHeader({ theme, done, total, onOpenTheme }: SignerHeaderProps) {
  const label = done >= total ? 'All fields complete' : `Field ${done + 1} of ${total}`;

  return (
    <header className="signer-header">
      <BrandMark name={theme.companyName} logoUrl={theme.logoUrl} />

      <div className="header-doc">
        <span className="header-doc-name">
          Service Agreement
        </span>
        <span className="header-doc-meta">
          Requested by
          {' '}
          {theme.companyName}
        </span>
      </div>

      <div className="header-progress">
        <span className="progress-label">
          {label}
        </span>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${total ? done / total * 100 : 0}%` }} />
        </div>
      </div>

      <Button label="Brand theme" variant="outline" size="small" onClick={onOpenTheme} />
    </header>
  );
}
