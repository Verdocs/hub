import type { Ref, SelectHTMLAttributes } from 'react';

export interface ISelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value reported when the option is selected. */
  value: string;
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** The label for the field. */
  label?: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  description?: string;
  /** The options to list. */
  options: ISelectOption[];
  ref?: Ref<HTMLSelectElement>;
}

/**
 * A standard select field with minimal markup, styled to match the other
 * controls. All native select attributes pass through, so supply value and
 * onChange (or defaultValue) as you would with a plain select element.
 */
export default function SelectInput({ label, description, options, required = false, className = '', ref, ...rest }: SelectInputProps) {
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

      <select
        ref={ref}
        required={required}
        className="vdocs:w-full vdocs:h-10 vdocs:px-2 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:cursor-pointer vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted vdocs:disabled:cursor-default"
        {...rest}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {description && (
        <div className="vdocs:text-xs vdocs:text-muted vdocs:mt-1">
          {description}
        </div>
      )}
    </label>
  );
}
