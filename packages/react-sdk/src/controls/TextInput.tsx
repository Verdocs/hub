import { useState, type FC, type InputHTMLAttributes, type Ref } from 'react';
import { ClearIcon, CopyIcon, EyeIcon, EyeSlashIcon } from './icons';
import { showToast } from '../utils/toast';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The label for the field. */
  label?: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  description?: string;
  /** If set, a clear button will be displayed when the field has a value. */
  clearable?: boolean;
  /**
   * If set, a copy-to-clipboard button will be displayed. A field may not be both
   * clearable and copyable; clearable wins if both are set.
   */
  copyable?: boolean;
  /** Only text-like input types are supported by this control. */
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
  /** Called when the user clicks the clear button. */
  onClear?: () => void;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A standard text input field with minimal markup, styled to match the other
 * controls. This is a controlled component: supply value and onChange.
 */
export const TextInput: FC<TextInputProps> = ({
  label,
  description,
  clearable = false,
  copyable = false,
  type = 'text',
  required = false,
  onClear,
  className = '',
  value,
  ref,
  ...rest
}) => {
  const [showingPw, setShowingPw] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(String(value ?? ''))
      .then(() => showToast('Copied!'))
      .catch(() => showToast('Unable to copy to the clipboard.', { style: 'error' }));
  };

  return (
    <label className={`vdocs:block vdocs:font-sans vdocs:mb-2.5 ${className}`}>
      {label && (
        <div className="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          {label}
          :
          {required && (
            <span className="vdocs:text-danger">
              *
            </span>
          )}
        </div>
      )}

      <div className="vdocs:relative vdocs:flex vdocs:items-center">
        <input
          ref={ref}
          type={type === 'password' && showingPw ? 'text' : type}
          value={value}
          required={required}
          data-lpignore="true"
          className="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
          {...rest}
        />

        {clearable && !!value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => onClear?.()}
            className="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-edge vdocs:hover:text-muted">
            <ClearIcon className="vdocs:size-4" />
          </button>
        )}

        {type === 'password' && (
          <button
            type="button"
            aria-label={showingPw ? 'Hide password' : 'Show password'}
            onClick={() => setShowingPw(!showingPw)}
            className="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-muted">
            {showingPw ? <EyeIcon className="vdocs:size-5" /> : <EyeSlashIcon className="vdocs:size-5" />}
          </button>
        )}

        {!clearable && copyable && !!value && (
          <button
            type="button"
            aria-label="Copy to clipboard"
            onClick={copyToClipboard}
            className="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-muted">
            <CopyIcon className="vdocs:size-4" />
          </button>
        )}
      </div>

      {description && (
        <div className="vdocs:text-xs vdocs:text-muted vdocs:mt-1">
          {description}
        </div>
      )}
    </label>
  );
};
