import { useEffect, useRef } from 'react';
import { signerClassName, type FieldBaseProps } from './types';

export interface FieldInitialProps extends FieldBaseProps {
  /** Resolved URL for the adopted initials image (a data:, blob:, or https: URL). */
  initialUrl?: string;
  /** Called when the user clicks the unsigned field to start the adopt-initials flow. */
  onBeginSigning?: () => void;
}

const BOX_CLASSES =
  'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:w-[83px] vdocs:h-9 vdocs:text-[11px] vdocs:tracking-[0.3px] vdocs:scroll-my-5';

const IMAGE_CLASSES = 'vdocs:block vdocs:h-full vdocs:w-auto vdocs:max-w-none';

/**
 * Displays an initials field. Unsigned, it renders the "Initial" affordance and reports
 * clicks through onBeginSigning so the caller can run the adopt-initials dialog. Once
 * initialed (initialUrl set) or done, the adopted image is drawn sized to the field box.
 *
 * The legacy component fetched the initials blob by ID itself. Here the caller resolves
 * the image and passes a URL; the sign embed will own that lookup, along with the legacy
 * Edit/Clear menu on a completed field. Builder-only affordances (drag, resize, the
 * settings popover) are omitted per docs/PORTING.md.
 */
export default function FieldInitial({
  field,
  initialUrl,
  onBeginSigning,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  className = '',
  ...rest
}: FieldInitialProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focused) {
      buttonRef.current?.focus();
    }
  }, [focused]);

  if (done) {
    return (
      <div className={`vdocs-field vdocs-done ${BOX_CLASSES} ${className}`} {...rest}>
        {initialUrl && <img className={IMAGE_CLASSES} src={initialUrl} alt="Initial" />}
      </div>
    );
  }

  const filled = !!initialUrl;
  const required = !!field.required;

  const wrapperClasses = [
    'vdocs-field',
    required && 'vdocs-required',
    disabled && 'vdocs-disabled',
    focused && 'vdocs-focused',
    filled && 'vdocs-filled',
    signerClassName(signerIndex),
    BOX_CLASSES,
    'vdocs:cursor-pointer',
    // Filled fields drop their border and background so only the image shows. The signer
    // class stays on the element as a white-label hook; bg-transparent outranks it because
    // the utilities layer comes after components, standing in for the legacy .filled !important.
    filled
      ? 'vdocs:bg-transparent'
      : `vdocs:border vdocs:border-solid ${required ? 'vdocs:border-danger' : 'vdocs:border-[rgba(0,0,0,0.2)]'}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} {...rest}>
      {field.label && (
        // The legacy chip was a bare <label>; a span avoids implying a form association
        // that does not exist.
        <span className="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:text-white vdocs:bg-[#4a4a99] vdocs:rounded-t-[2px]">
          {field.label}
        </span>
      )}

      {filled ? (
        <div className={`vdocs:relative vdocs:size-full ${disabled ? 'vdocs:opacity-50 vdocs:pointer-events-none' : ''}`}>
          <img className={IMAGE_CLASSES} src={initialUrl} alt="Initial" />
        </div>
      ) : (
        <button
          type="button"
          ref={buttonRef}
          disabled={disabled}
          onClick={onBeginSigning}
          className="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default">
          Initial
        </button>
      )}
    </div>
  );
}
