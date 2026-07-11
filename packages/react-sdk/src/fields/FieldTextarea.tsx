import { useEffect, useRef, useState } from 'react';
import { fieldValue, signerClassName, type FieldBaseProps } from './types';

export interface FieldTextareaProps extends FieldBaseProps {
  /** Called with the full text content after each edit. */
  onFieldChange?: (value: string) => void;
}

// The legacy 150x15 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[150px] vdocs:h-[15px] vdocs:font-sans vdocs:text-[11px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

/**
 * A multi-line text entry field for signing. The textarea is uncontrolled:
 * field.value (or the template default) seeds it, and hosts persist edits
 * reported through onFieldChange. Set done to render the final value as text.
 */
export default function FieldTextarea({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  className = '',
  onFieldChange,
  ...rest
}: FieldTextareaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  // Replaces the legacy focusField() imperative method: the sign flow drives focus
  // through the focused prop as it walks the signer from field to field.
  useEffect(() => {
    if (focused) {
      inputRef.current?.focus();
    }
  }, [focused]);

  const value = fieldValue(field);
  const label = field.label ?? '';
  const required = !!field.required;
  const readonly = !!field.readonly;

  if (done) {
    return (
      <div className={`vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:text-ink ${className}`} {...rest}>
        {value}
      </div>
    );
  }

  const wrapperClasses = [
    'vdocs-field',
    signerClassName(signerIndex),
    BOX_CLASSES,
    'vdocs:border vdocs:border-solid',
    required ? 'vdocs-field-required vdocs:border-danger' : 'vdocs:border-ink/20',
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

      <textarea
        ref={inputRef}
        name={field.name}
        aria-label={label || field.name}
        required={required}
        placeholder={field.placeholder ?? ''}
        disabled={readonly || disabled}
        defaultValue={value}
        onChange={e => onFieldChange?.(e.target.value)}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        className={`vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:resize-none vdocs:border-none vdocs:outline-none vdocs:bg-transparent vdocs:px-[3px] vdocs:py-0 vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink${
          disabled ? ' vdocs:opacity-50' : ''
        }`}
      />
    </div>
  );
}
