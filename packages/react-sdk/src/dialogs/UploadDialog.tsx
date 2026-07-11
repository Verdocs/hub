import { useState } from 'react';
import FileChooser from '../controls/FileChooser';
import Button from '../controls/Button';
import Dialog from './Dialog';

const DEFAULT_ACCEPT = '.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

const MB = 1024 * 1024;

export interface UploadDialogProps {
  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF, Word, and image files. */
  accept?: string;
  /** If set, the user may choose more than one file. */
  multiple?: boolean;
  /** Maximum total size of the selected files, in bytes. Defaults to 20MB. */
  maxSize?: number;
  /** Fired with the chosen files when the user clicks Upload. */
  onUpload?: (files: File[]) => void;
  /** Fired when the user clicks Cancel, the close button, or the background overlay. */
  onCancel?: () => void;
}

/**
 * Prompts the user to pick one or more files to attach. Nothing is transmitted:
 * the chosen files are handed to the caller via onUpload, and the caller performs
 * the actual upload and unmounts the dialog. Purely presentational; render it
 * conditionally like the other dialogs.
 */
export default function UploadDialog({ accept = DEFAULT_ACCEPT, multiple = false, maxSize = 20 * MB, onUpload, onCancel }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const tooBig = totalSize > maxSize;

  // The legacy dialog hard-coded "20MB" in this message even when maxSize was customized;
  // we derive the label from the actual limit instead.
  const limitLabel = maxSize >= MB ? `${Math.round((maxSize / MB) * 10) / 10}MB` : `${Math.round(maxSize / 1024)}KB`;

  return (
    <Dialog
      heading="Upload attachment"
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-4">
          <Button label="Cancel" variant="outline" onClick={() => onCancel?.()} />
          <Button label="Upload" disabled={tooBig || files.length < 1} onClick={() => onUpload?.(files)} />
        </div>
      )}>
      {/* The dashed frame preserves the legacy drop-target affordance around the shared picker. */}
      <div className="vdocs:rounded-ctl vdocs:border-2 vdocs:border-dashed vdocs:border-edge">
        <FileChooser accept={accept} multiple={multiple} onSelectFiles={setFiles} />
      </div>

      {tooBig && (
        <div className="vdocs:mt-4 vdocs:text-sm vdocs:text-danger">
          {`Total file size must not exceed ${limitLabel}.`}
        </div>
      )}
    </Dialog>
  );
}
