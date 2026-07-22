import { useEffect, useRef, useState } from 'react';
import { ClearIcon, FileCheckIcon, PaperclipIcon } from '../controls/icons';
import { fieldValue, signerClassName, type FieldBaseProps } from './types';

export interface FieldAttachmentProps extends FieldBaseProps {
  /** Called with the chosen file when the signer picks an attachment. */
  onSelectFile?: (file: File) => void;
  /** Called when the signer removes the current attachment. */
  onDeleteFile?: () => void;
}

// The legacy 24x24 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-6 vdocs:h-6 vdocs:font-sans vdocs:text-[11px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

/**
 * An attachment field for signing. The legacy component opened an upload dialog;
 * the port goes straight to the platform file picker instead, reporting the chosen
 * File through onSelectFile. Whether a file is attached derives from field.value
 * (the stored file name), so hosts update the field after handling the upload. The
 * 24px legacy box has no room for a name, so it surfaces as the button tooltip.
 */
export default function FieldAttachment({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  className = '',
  onSelectFile,
  onDeleteFile,
  ...rest
}: FieldAttachmentProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  // Replaces the legacy focusField() imperative method: the sign flow drives focus
  // through the focused prop as it walks the signer from field to field.
  useEffect(() => {
    if (focused) {
      buttonRef.current?.focus();
    }
  }, [focused]);

  const fileName = fieldValue(field);
  const hasFile = !!fileName;
  const label = field.label ?? '';
  const required = !!field.required;
  const readonly = !!field.readonly;
  const inactive = disabled || readonly;

  const handlePick = () => {
    // Clearing before the dialog opens means re-picking the same file still fires onChange.
    if (fileRef.current) {
      fileRef.current.value = '';
      fileRef.current.click();
    }
  };

  if (done) {
    return (
      <div className={`vdocs-field vdocs-field-done ${BOX_CLASSES} ${className}`} {...rest}>
        <div className="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6">
          {hasFile ?
            <FileCheckIcon className="vdocs:size-4 vdocs:text-success" title="File attached" /> :
            <PaperclipIcon className="vdocs:size-4 vdocs:text-ink" title="No file attached" />}
        </div>
      </div>
    );
  }

  const wrapperClasses = [
    'vdocs-field',
    signerClassName(signerIndex),
    BOX_CLASSES,
    required ? 'vdocs-field-required' : '',
    disabled ? 'vdocs-field-disabled' : '',
    // The legacy focused treatment was a ripple animation in the app-level stylesheet.
    // An accent ring gives the same cue without shipping keyframes.
    focused || hasFocus ? 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} {...rest}>
      {label && (
        <label className={LABEL_CLASSES}>
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        title={hasFile ? fileName : undefined}
        aria-label={label || field.name}
        disabled={inactive}
        onClick={handlePick}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        className={`vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6 vdocs:p-0 vdocs:bg-transparent vdocs:outline-none vdocs:cursor-pointer vdocs:disabled:cursor-default ${
          required ? 'vdocs:border vdocs:border-solid vdocs:border-danger' : 'vdocs:border-none'
        }${disabled ? ' vdocs:opacity-50' : ''}`}>
        {hasFile ?
          <FileCheckIcon className="vdocs:size-4 vdocs:text-success" /> :
          <PaperclipIcon className="vdocs:size-4 vdocs:text-ink" />}
      </button>

      {hasFile && !inactive && (
        <button
          type="button"
          aria-label="Remove attachment"
          onClick={() => onDeleteFile?.()}
          className="vdocs:absolute vdocs:-top-1.5 vdocs:-right-1.5 vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-3.5 vdocs:p-0 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-full vdocs:cursor-pointer vdocs:text-muted vdocs:hover:text-ink">
          <ClearIcon className="vdocs:size-2.5" />
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        aria-label="Attach a file"
        disabled={inactive}
        className="vdocs:sr-only"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            onSelectFile?.(file);
          }
        }}
      />
    </div>
  );
}
