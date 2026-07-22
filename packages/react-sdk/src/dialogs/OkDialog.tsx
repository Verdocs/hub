import type { ReactNode } from 'react';
import Button from '../controls/Button';
import Dialog from './Dialog';

export interface OkDialogProps {
  /** The title of the dialog. "title" is a reserved word, so we use heading. */
  heading?: ReactNode;
  /** The message content to display. The legacy component took an HTML string; pass JSX here instead. */
  message?: ReactNode;
  /** Override the OK button's label. */
  buttonLabel?: string;
  /** If set, a Cancel button is also displayed. */
  showCancel?: boolean;
  /** Fired when the user clicks the OK button. */
  onOk?: () => void;
  /** Fired when the user clicks Cancel, the close button, or the background overlay. */
  onCancel?: () => void;
}

/**
 * A simple message dialog with an OK button and an optional Cancel button. Purely
 * presentational: the caller renders it conditionally and unmounts it in onOk/onCancel.
 * Regardless of showCancel, the dialog is always dismissable via the overlay and the
 * close button, both of which fire onCancel.
 */
export default function OkDialog({ heading, message, buttonLabel = 'OK', showCancel = false, onOk, onCancel }: OkDialogProps) {
  // The legacy heading also rendered a document icon, but the base dialog styles hid it
  // (the design moved to a plain title plus close button), so we don't port it.
  return (
    <Dialog
      heading={heading}
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
          {showCancel && <Button label="Cancel" variant="outline" onClick={() => onCancel?.()} />}
          <Button label={buttonLabel} onClick={() => onOk?.()} />
        </div>
      )}>
      {message}
    </Dialog>
  );
}
