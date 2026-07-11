import { useEffect, useRef } from 'react';
import { signerClassName, type FieldBaseProps } from './types';
import { CheckIcon } from '../controls/icons';

export interface FieldPaymentProps extends FieldBaseProps {
  /** Render the payment-collected treatment instead of the payment affordance. */
  paid?: boolean;
  /** Called when the user clicks the unpaid field to start the payment flow. */
  onBeginPayment?: () => void;
}

const BOX_CLASSES =
  'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:size-6 vdocs:text-[11px] vdocs:scroll-my-5 vdocs:border vdocs:border-solid vdocs:border-[#ccffaa]';

/**
 * Displays a payment field. Unpaid, it renders a dollar-sign affordance and reports clicks
 * through onBeginPayment so the caller can run the payment flow; paid or done, it renders
 * a dollar-and-check "collected" treatment.
 *
 * This is a representative display port. The legacy component carried vestigial payment
 * plumbing with no provider integration: recipient lists feeding a prepared-by message that
 * never rendered, and a stamp image that was never populated. Collecting a payment belongs
 * to the sign embed era, so none of that is ported. Builder-only affordances (drag, resize,
 * the settings popover) are omitted per docs/PORTING.md.
 */
export default function FieldPayment({
  field,
  paid = false,
  onBeginPayment,
  disabled = false,
  done = false,
  focused = false,
  signerIndex = 0,
  className = '',
  ...rest
}: FieldPaymentProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focused) {
      buttonRef.current?.focus();
    }
  }, [focused]);

  // The legacy component drew "$" plus a check character once payment was collected. We
  // keep the treatment but draw the check as an icon so the glyph scales with the box.
  const paidTreatment = (
    <span
      role="img"
      aria-label="Paid"
      className="vdocs:flex vdocs:size-full vdocs:items-center vdocs:justify-center vdocs:gap-px vdocs:font-medium vdocs:text-[rgba(0,0,0,0.87)]">
      $
      <CheckIcon className="vdocs:size-3" />
    </span>
  );

  if (done) {
    return (
      <div className={`vdocs-field vdocs-done ${BOX_CLASSES} ${className}`} {...rest}>
        {paidTreatment}
      </div>
    );
  }

  const wrapperClasses = [
    'vdocs-field',
    field.required && 'vdocs-required',
    disabled && 'vdocs-disabled',
    focused && 'vdocs-focused',
    paid && 'vdocs-filled',
    signerClassName(signerIndex),
    BOX_CLASSES,
    'vdocs:cursor-pointer',
    disabled && 'vdocs:opacity-50',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} {...rest}>
      {paid ? (
        paidTreatment
      ) : (
        <button
          type="button"
          ref={buttonRef}
          disabled={disabled}
          onClick={onBeginPayment}
          aria-label="Payment"
          className="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default">
          $
        </button>
      )}
    </div>
  );
}
