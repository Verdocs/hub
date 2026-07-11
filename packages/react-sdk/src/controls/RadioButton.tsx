import type { InputHTMLAttributes, Ref } from 'react';

export interface RadioButtonProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label displayed to the right of the button. Leave blank for no label. */
  label?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * A simple radio button for UI displays, e.g. dialog boxes. This is distinct from
 * the field radio button used in signing experiences. Buttons sharing the same
 * name form a group. Supply checked plus onChange for controlled use, or
 * defaultChecked to let the input manage itself.
 */
export default function RadioButton({ label, className = '', ref, ...rest }: RadioButtonProps) {
  return (
    <label
      className={`vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50 ${className}`}>
      <input
        ref={ref}
        type="radio"
        className="vdocs:appearance-none vdocs:m-0 vdocs:size-4 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-ink/60 vdocs:bg-canvas vdocs:transition vdocs:duration-200 vdocs:outline-none vdocs:checked:bg-primary vdocs:checked:ring-2 vdocs:checked:ring-inset vdocs:checked:ring-canvas vdocs:focus-visible:border-primary vdocs:disabled:cursor-default vdocs:disabled:bg-canvas vdocs:disabled:border-canvas"
        {...rest}
      />
      {label && (
        <span className="vdocs:text-sm">
          {label}
        </span>
      )}
    </label>
  );
}
