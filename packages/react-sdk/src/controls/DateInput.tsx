import type { InputHTMLAttributes, Ref } from 'react';

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The label for the field. */
  label?: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  description?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A standard date input field, styled to match the other controls. The value
 * is always an ISO yyyy-mm-dd string: read e.target.value (or valueAsDate) in
 * onChange. Supply value and onChange for controlled use, or defaultValue to
 * leave it uncontrolled.
 */
export default function DateInput({ label, description, required = false, className = '', ref, ...rest }: DateInputProps) {
  // The legacy Stencil control embedded the air-datepicker widget. The native SDKs lean on the
  // platform date picker (input type="date") instead: no dependency, and a stable value format.
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

      <input
        ref={ref}
        type="date"
        required={required}
        data-lpignore="true"
        className="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
        {...rest}
      />

      {description && (
        <div className="vdocs:text-xs vdocs:text-muted vdocs:mt-1">
          {description}
        </div>
      )}
    </label>
  );
}
