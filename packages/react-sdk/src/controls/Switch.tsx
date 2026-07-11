import type { ChangeEvent, InputHTMLAttributes, Ref } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label displayed to the right of the switch. Without one, supply aria-label instead. */
  label?: string;
  /** Select the green (primary) or blue (secondary) treatment. */
  theme?: 'primary' | 'secondary';
  /** Called with the new value when the user toggles the switch. */
  onCheckedChange?: (checked: boolean) => void;
  ref?: Ref<HTMLInputElement>;
}

const THEME_CLASSES = {
  primary: 'vdocs:checked:bg-primary',
  secondary: 'vdocs:checked:bg-accent-dark',
};

/**
 * A toggle switch for boolean settings. Wraps a native checkbox input exposed with
 * the switch role, so it participates in forms and assistive tech like any input.
 * Subscribe to onCheckedChange for the new value, or onChange for the raw event.
 */
export default function Switch({ label, theme = 'primary', onCheckedChange, onChange, className = '', ref, ...rest }: SwitchProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <label className={`vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-not-allowed ${className}`}>
      {/* The input is the track. The thumb has to be a following sibling, not a
          child, for peer-checked to move it. */}
      <span className="vdocs:relative vdocs:inline-flex vdocs:h-6 vdocs:w-11 vdocs:shrink-0">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          onChange={handleChange}
          className={`vdocs:peer vdocs:appearance-none vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:size-full vdocs:cursor-pointer vdocs:rounded-full vdocs:bg-edge-light vdocs:transition-colors vdocs:duration-150 vdocs:disabled:cursor-not-allowed vdocs:disabled:bg-disabled ${THEME_CLASSES[theme]}`}
          {...rest}
        />
        <span className="vdocs:pointer-events-none vdocs:absolute vdocs:top-0.5 vdocs:left-0.5 vdocs:size-5 vdocs:rounded-full vdocs:bg-white vdocs:shadow-lg vdocs:transition-transform vdocs:duration-150 vdocs:peer-checked:translate-x-5" />
      </span>
      {label && (
        <span className="vdocs:text-sm">
          {label}
        </span>
      )}
    </label>
  );
}
