import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Button from './Button';

const DEFAULT_ACCEPT = 'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface FileChooserProps {
  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF and Word documents. */
  accept?: string;
  /** If set, the user may choose more than one file. */
  multiple?: boolean;
  /**
   * Called when the selection changes. The list is empty when the selection is cleared,
   * e.g. while the user is choosing a different file. Host applications should use this
   * to enable/disable buttons that upload or otherwise process the selection.
   */
  onSelectFiles?: (files: File[]) => void;
}

/**
 * Displays a file picker to upload an attachment: a drag-and-drop target plus a
 * click-to-browse button. This component is just the picker; the host application
 * provides the actual upload functionality.
 */
export default function FileChooser({ accept = DEFAULT_ACCEPT, multiple = false, onSelectFiles }: FileChooserProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applySelection = (selected: File[]) => {
    setFiles(selected);
    onSelectFiles?.(selected);
  };

  const handleFilesChanged = (e: ChangeEvent<HTMLInputElement>) => {
    applySelection(Array.from(e.target.files ?? []));
  };

  const handleBrowse = () => {
    // The selection resets before the dialog opens so hosts can disable their upload buttons
    // while a new pick is pending. Clearing the input's value also means re-picking the same
    // file still fires a change event.
    applySelection([]);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    // preventDefault marks the box as a valid drop target; without it the browser opens the file.
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // dragleave also fires when the cursor moves over child nodes; only clear the highlight
    // when the cursor actually left the box.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    // The accept attribute only filters the browse dialog; browsers don't enforce it on drops.
    // Hosts validate file types when they process the upload anyway.
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) {
      applySelection(multiple ? dropped : dropped.slice(0, 1));
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`vdocs:flex vdocs:flex-col vdocs:box-border vdocs:font-sans vdocs:text-center vdocs:text-muted vdocs:bg-surface vdocs:rounded-ctl vdocs:px-4 vdocs:py-10 ${
        dragging ? 'vdocs:outline-2 vdocs:outline-dashed vdocs:outline-accent' : ''
      }`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label="Select a file"
        className="vdocs:sr-only"
        onChange={handleFilesChanged}
      />

      <div className="vdocs:text-xl vdocs:font-bold vdocs:wrap-anywhere">
        {files.length ? files.map(file => file.name).join(', ') : 'Drag a file here'}
      </div>

      <div className="vdocs:h-5 vdocs:my-5 vdocs:text-base">
        {files.length ? '' : 'Or, if you prefer...'}
      </div>

      <Button
        size="small"
        label={files.length ? 'Select a different file' : 'Select a file from your computer'}
        onClick={handleBrowse}
      />
    </div>
  );
}
