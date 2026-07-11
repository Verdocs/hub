import { useEffect, useRef } from 'react';
import { type FieldBaseProps, fieldValue, signerClassName } from './types';
import { CaretDownIcon } from '../controls/icons';

export interface FieldDropdownProps extends FieldBaseProps {
  /** Called with the selected option's id when the signer picks an option. */
  onFieldChange?: (value: string) => void;
}

/**
 * A dropdown signing field that lets the signer choose one of the field's
 * options. Renders the field's current value from props and reports selection
 * through onFieldChange. Builder affordances (dragging, the settings popover)
 * are not ported; see docs/PORTING.md.
 */
export default function FieldDropdown({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  onFieldChange,
  className = '',
  ...rest
}: FieldDropdownProps) {
  const selectRef = useRef<HTMLSelectElement>(null);

  // The legacy focusField() imperative method becomes the focused prop: when
  // the parent flips it on, move real keyboard focus onto the select.
  useEffect(() => {
    if (focused) {
      selectRef.current?.focus();
    }
  }, [focused]);

  const value = fieldValue(field);

  if (done) {
    return (
      <div
        className={`vdocs-field vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink ${className}`}
        {...rest}>
        {value}
      </div>
    );
  }

  // Envelope fields send options: null, and required/readonly are
  // boolean | null, so coerce instead of relying on destructure defaults
  // (those only cover undefined).
  const options = field.options ?? [];
  const required = !!field.required;

  const wrapperClasses = [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:rounded-ctl vdocs:font-sans',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
    className,
  ].filter(Boolean).join(' ');

  const selectClasses = [
    'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full vdocs:appearance-none vdocs:cursor-pointer',
    'vdocs:py-0 vdocs:pl-1 vdocs:pr-3.5 vdocs:text-[11px] vdocs:font-medium vdocs:text-ink vdocs:bg-transparent',
    'vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:outline-none',
    'vdocs:disabled:opacity-50 vdocs:disabled:cursor-default',
    required ? 'vdocs:border-danger' : 'vdocs:border-edge',
  ].join(' ');

  return (
    <div className={wrapperClasses} {...rest}>
      {field.label && (
        <div
          aria-hidden="true"
          className="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
          {field.label}
        </div>
      )}

      <select
        ref={selectRef}
        name={field.name}
        aria-label={field.label || field.name}
        defaultValue={value}
        required={required}
        disabled={!!field.readonly || disabled}
        onChange={e => onFieldChange?.(e.target.value)}
        className={selectClasses}>
        <option value="">
          Select...
        </option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
        {!options.length && (
          <option value="NA">
            N/A
          </option>
        )}
      </select>

      <CaretDownIcon className="vdocs:pointer-events-none vdocs:absolute vdocs:top-1/2 vdocs:right-0.5 vdocs:size-3 vdocs:-translate-y-1/2 vdocs:text-ink" />
    </div>
  );
}
