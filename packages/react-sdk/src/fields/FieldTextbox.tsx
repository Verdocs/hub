import { useEffect, useRef } from 'react';
import { type FieldBaseProps, fieldValue, signerClassName } from './types';

export interface FieldTextboxProps extends FieldBaseProps {
  /** Called with the full new text after every keystroke. */
  onFieldChange?: (value: string) => void;
}

/**
 * A single-line text signing field. Renders the field's current value from
 * props and reports edits through onFieldChange. The legacy component switched
 * to a textarea for multiline fields; that mode is FieldTextarea's job here.
 * Builder affordances (dragging, resizing, the settings popover) are not
 * ported; see docs/PORTING.md.
 */
export default function FieldTextbox({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  onFieldChange,
  className = '',
  ...rest
}: FieldTextboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // The legacy focusField() imperative method becomes the focused prop: when
  // the parent flips it on, move real keyboard focus onto the input.
  useEffect(() => {
    if (focused) {
      inputRef.current?.focus();
    }
  }, [focused]);

  const value = fieldValue(field);

  if (done) {
    return (
      <div
        className={`vdocs-field vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:tracking-[-0.2px] vdocs:text-ink ${className}`}
        {...rest}>
        {value}
      </div>
    );
  }

  // required and readonly are boolean | null on both field shapes, so coerce
  // instead of relying on destructure defaults (those only cover undefined).
  const required = !!field.required;
  const small = (field.height ?? 15) < 15;

  // Carried over from the legacy component: the field's pixel width caps how
  // many characters fit, at roughly 5px per character.
  const maxLength = Math.floor((field.width ?? 150) / 5);

  const wrapperClasses = [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:rounded-ctl vdocs:font-sans vdocs:tracking-[-0.2px]',
    'vdocs:border vdocs:border-solid',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    required ? 'vdocs:border-danger' : 'vdocs:border-edge',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full',
    'vdocs:border-none vdocs:outline-none vdocs:bg-transparent',
    'vdocs:py-0 vdocs:px-[3px] vdocs:font-medium vdocs:text-ink',
    'vdocs:disabled:opacity-50',
    small ? 'vdocs:text-[8px]' : 'vdocs:text-[11px]',
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

      <input
        ref={inputRef}
        type="text"
        name={field.name}
        aria-label={field.label || field.name}
        defaultValue={value}
        maxLength={maxLength}
        placeholder={field.placeholder ?? ''}
        required={required}
        disabled={!!field.readonly || disabled}
        data-lpignore="true"
        onChange={e => onFieldChange?.(e.target.value)}
        className={inputClasses}
      />
    </div>
  );
}
