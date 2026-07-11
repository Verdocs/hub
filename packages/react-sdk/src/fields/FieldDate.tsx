import { useEffect, useRef, useState } from 'react';
import { fieldValue, signerClassName, type FieldBaseProps } from './types';

export interface FieldDateProps extends FieldBaseProps {
  /** Called with the picked date as an ISO yyyy-mm-dd string, empty when cleared. */
  onFieldChange?: (isoDate: string) => void;
}

// The legacy 74x20 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[74px] vdocs:h-5 vdocs:font-sans vdocs:text-[11px] vdocs:tracking-[0.3px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

// Stored values may be date-only strings or full ISO timestamps. The native date input
// only accepts yyyy-mm-dd, so we trim ISO strings and fall back to parsing anything else
// with local date parts (round-tripping through toISOString would shift days across
// timezones).
const toInputDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

// Date-only strings parse as UTC midnight, so calling toLocaleDateString on the parsed
// Date would show the previous day in negative-offset timezones. Building the Date from
// its parts keeps the displayed date the one the signer picked.
const toDisplayDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toInputDate(value));
  if (!match) {
    return value;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString();
};

/**
 * A date entry field for signing. The legacy component embedded the air-datepicker
 * widget; like the DateInput control, we lean on the platform picker (input
 * type="date") instead: no dependency, and a stable yyyy-mm-dd value format. Native
 * date inputs ignore placeholder text, so the legacy "Date..." placeholder is dropped.
 */
export default function FieldDate({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  className = '',
  onFieldChange,
  ...rest
}: FieldDateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
  // The legacy field dropped to a smaller font when the field box was drawn small.
  const small = (field.width ?? 74) < 74 || (field.height ?? 20) < 20;

  if (done) {
    return (
      <div className={`vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:font-medium vdocs:text-ink ${className}`} {...rest}>
        {toDisplayDate(value)}
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

      <input
        ref={inputRef}
        type="date"
        name={field.name}
        aria-label={label || field.name}
        required={required}
        disabled={readonly || disabled}
        defaultValue={toInputDate(value)}
        onChange={e => onFieldChange?.(e.target.value)}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        className={`vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:appearance-none vdocs:outline-none vdocs:bg-transparent vdocs:font-sans vdocs:font-medium vdocs:text-ink vdocs:border vdocs:border-solid ${
          required ? 'vdocs:border-danger' : 'vdocs:border-edge-light'
        } ${small ? 'vdocs:text-[7px]' : 'vdocs:text-xs'}${disabled ? ' vdocs:opacity-50' : ''}`}
      />
    </div>
  );
}
