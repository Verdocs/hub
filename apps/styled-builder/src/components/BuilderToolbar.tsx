import { Button } from '@verdocs/react-sdk';
import type { BrandTheme } from '../theme/theme';
import BrandMark from './BrandMark';

export interface BuilderToolbarProps {
  /** The active brand values, used for the logo and company name. */
  theme: BrandTheme;
  /** Called when the user clicks the Brand theme button. */
  onOpenTheme: () => void;
}

/**
 * Static top chrome for the builder stub: document identity on the left,
 * page and zoom indicators in the middle, actions on the right. Everything
 * is styled from the vdocs tokens so the theme dialog restyles it live.
 */
export default function BuilderToolbar({ theme, onOpenTheme }: BuilderToolbarProps) {
  return (
    <header className="builder-toolbar">
      <BrandMark name={theme.companyName} logoUrl={theme.logoUrl} />

      <div className="toolbar-doc">
        <span className="toolbar-doc-name">
          Mutual NDA
        </span>
        <span className="toolbar-doc-meta">
          Draft template
        </span>
      </div>

      <div className="toolbar-controls">
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
          Page 1 of 2
        </span>
      </div>

      <div className="toolbar-actions">
        <Button label="Brand theme" variant="outline" size="small" onClick={onOpenTheme} />
        <Button label="Preview" variant="text" size="small" />
        <Button label="Save template" size="small" />
      </div>
    </header>
  );
}
