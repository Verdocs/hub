import { createPortal } from 'react-dom';
import type { MouseEvent, ReactNode } from 'react';
import ClearIcon from '../controls/icons/ClearIcon';

export interface DialogProps {
  /** Rendered in the header row. Plain strings get the title treatment. */
  heading?: ReactNode;
  /** The dialog body. */
  children?: ReactNode;
  /** Rendered below the body, typically an action button row. */
  footer?: ReactNode;
  /** If true, clicking the background overlay will not close the dialog. */
  persistent?: boolean;
  /** Fired when the user dismisses via the overlay or the close button. */
  onClose?: () => void;
}

/**
 * The base modal dialog: a centered panel over a dimmed overlay, portaled to
 * document.body. The other dialogs compose this and supply heading, body, and
 * footer content. Dismissal is the caller's job: render conditionally and
 * clear your own state in onClose.
 */
export default function Dialog({ heading, children, footer, persistent = false, onClose }: DialogProps) {
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    // Only a direct overlay click dismisses; clicks inside the panel land on
    // descendants and stay put.
    if (!persistent && event.target === event.currentTarget) {
      event.preventDefault();
      onClose?.();
    }
  };

  return createPortal(
    <div
      className="vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:flex vdocs:items-center vdocs:justify-center vdocs:bg-ink/40 vdocs:font-sans vdocs:box-border"
      onClick={handleOverlayClick}>
      <div
        role="dialog"
        aria-modal="true"
        className="vdocs:relative vdocs:flex vdocs:w-[520px] vdocs:max-w-[95%] vdocs:flex-col vdocs:overflow-hidden vdocs:rounded-lg vdocs:bg-surface vdocs:shadow-lg">
        <button
          type="button"
          aria-label="Close"
          onClick={() => onClose?.()}
          className="vdocs:absolute vdocs:top-4 vdocs:right-4 vdocs:z-20 vdocs:flex vdocs:size-6 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:text-edge vdocs:transition-colors vdocs:hover:text-muted vdocs:[&>svg]:size-5">
          <ClearIcon />
        </button>

        {heading !== undefined && (
          <div className="vdocs:flex vdocs:items-center vdocs:justify-between vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-6 vdocs:py-4">
            <div className="vdocs:text-2xl vdocs:font-medium vdocs:text-ink vdocs:leading-8">
              {heading}
            </div>
          </div>
        )}

        <div className="vdocs:p-6 vdocs:text-sm vdocs:text-ink">
          {children}
        </div>

        {footer !== undefined && (
          <div className="vdocs:px-6 vdocs:pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
