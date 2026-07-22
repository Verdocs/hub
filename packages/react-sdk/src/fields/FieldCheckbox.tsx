import { useEffect, useRef } from 'react';
import { type FieldBaseProps, fieldValue, signerClassName } from './types';
import Checkbox from '../controls/Checkbox';

export interface FieldCheckboxProps extends FieldBaseProps {
  /** Called with the new checked state when the signer toggles the box. */
  onFieldChange?: (checked: boolean) => void;
}

// The legacy done state printed a check mark or an empty box as text glyphs.
// Sources are ASCII-only and controls/icons has no check icon yet, so we draw
// the two shapes here. Promote to controls/icons if another port needs them.
function DoneGlyph({ checked }: { checked: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" role="img" aria-label={checked ? 'Checked' : 'Unchecked'} className="vdocs:size-3.5">
      {checked ? (
        <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <rect x={2.5} y={2.5} width={11} height={11} stroke="currentColor" strokeWidth={1.5} />
      )}
    </svg>
  );
}

/**
 * A checkbox signing field. Renders the field's current value from props and
 * reports toggles through onFieldChange. Builder affordances (dragging, the
 * settings popover) are not ported; see docs/PORTING.md.
 */
export default function FieldCheckbox({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  onFieldChange,
  className = '',
  ...rest
}: FieldCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // The legacy focusField() imperative method becomes the focused prop: when
  // the parent flips it on, move real keyboard focus onto the input.
  useEffect(() => {
    if (focused) {
      inputRef.current?.focus();
    }
  }, [focused]);

  const checked = fieldValue(field) === 'true';

  if (done) {
    return (
      <div className={`vdocs-field vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans vdocs:text-ink ${className}`} {...rest}>
        <DoneGlyph checked={checked} />
      </div>
    );
  }

  // required and readonly are boolean | null on both field shapes, so coerce
  // instead of relying on destructure defaults (those only cover undefined).
  const required = !!field.required;

  const wrapperClasses = [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    required && 'vdocs:border vdocs:border-solid vdocs:border-danger',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} {...rest}>
      {field.label && (
        <div
          aria-hidden="true"
          className="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
          {field.label}
        </div>
      )}

      <Checkbox
        ref={inputRef}
        size="small"
        name={field.name}
        aria-label={field.label || field.name}
        defaultChecked={checked}
        required={required}
        disabled={!!field.readonly || disabled}
        onChange={e => onFieldChange?.(e.target.checked)}
      />
    </div>
  );
}
