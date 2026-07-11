import { useEffect, useRef } from 'react';
import { type FieldBaseProps, fieldValue, signerClassName } from './types';
import RadioButton from '../controls/RadioButton';

export interface FieldRadioProps extends FieldBaseProps {
  /** Called with this option's id (the field name) when the signer selects it. */
  onFieldChange?: (selectedOptionId: string) => void;
}

// The legacy done state inlined these two Material circle glyphs as SVG
// strings. Controls/icons has no radio glyphs yet, so they live here.
const SELECTED_PATH =
  'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 '
  + '0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';
const UNSELECTED_PATH =
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';

function DoneGlyph({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-label={selected ? 'Selected' : 'Not selected'} className="vdocs:size-2.5">
      <path d={selected ? SELECTED_PATH : UNSELECTED_PATH} />
    </svg>
  );
}

/**
 * A radio button signing field. Each field is a single button; buttons sharing
 * the same group form an exclusive set. Renders the field's current value from
 * props and reports selection through onFieldChange. Builder affordances
 * (dragging, the settings popover, the group tag) are not ported; see
 * docs/PORTING.md.
 */
export default function FieldRadio({
  field,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  onFieldChange,
  className = '',
  ...rest
}: FieldRadioProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // The legacy focusField() imperative method becomes the focused prop: when
  // the parent flips it on, move real keyboard focus onto the input.
  useEffect(() => {
    if (focused) {
      inputRef.current?.focus();
    }
  }, [focused]);

  const selected = fieldValue(field) === 'true';

  if (done) {
    return (
      <div className={`vdocs-field vdocs:box-border vdocs:block vdocs:size-2.5 vdocs:font-sans vdocs:text-ink ${className}`} {...rest}>
        <DoneGlyph selected={selected} />
      </div>
    );
  }

  // required and readonly are boolean | null on both field shapes, so coerce
  // instead of relying on destructure defaults (those only cover undefined).
  const required = !!field.required;

  const wrapperClasses = [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:rounded-full vdocs:font-sans',
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

      <RadioButton
        ref={inputRef}
        name={field.group || field.name}
        aria-label={field.label || field.name}
        defaultChecked={selected}
        required={required}
        disabled={!!field.readonly || disabled}
        onChange={e => {
          if (e.target.checked) {
            onFieldChange?.(field.name);
          }
        }}
      />
    </div>
  );
}
