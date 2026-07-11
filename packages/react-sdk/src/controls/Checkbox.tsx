import type { InputHTMLAttributes, Ref } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label displayed to the right of the box. Leave blank for no label. */
  label?: string;
  /** Use 'dark' when rendering on a dark background (lightens the unchecked border). */
  theme?: 'light' | 'dark';
  /** The size of the box. */
  size?: 'normal' | 'small';
  ref?: Ref<HTMLInputElement>;
}

const SIZE_CLASSES = {
  normal: { box: 'vdocs:size-5', check: 'vdocs:size-3.5' },
  small: { box: 'vdocs:size-4', check: 'vdocs:size-3' },
};

const THEME_CLASSES = {
  light: 'vdocs:border-edge',
  dark: 'vdocs:border-white',
};

function CheckMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A simple check box for UI displays, e.g. dialog boxes. This is distinct from the
 * field checkbox used in signing experiences. Supply checked plus onChange for
 * controlled use, or defaultChecked to let the input manage itself.
 */
export default function Checkbox({ label, theme = 'light', size = 'normal', className = '', ref, ...rest }: CheckboxProps) {
  return (
    <label
      className={`vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50 ${className}`}>
      {/* The input is the visible box (appearance-none). The check mark has to be a
          following sibling, not a child, for peer-checked to reveal it. */}
      <span className="vdocs:relative vdocs:inline-flex vdocs:shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className={`vdocs:peer vdocs:appearance-none vdocs:m-0 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-[2px] vdocs:border-2 vdocs:border-solid vdocs:bg-transparent vdocs:checked:bg-primary vdocs:checked:border-primary vdocs:disabled:cursor-default ${SIZE_CLASSES[size].box} ${THEME_CLASSES[theme]}`}
          {...rest}
        />
        <CheckMark
          className={`vdocs:pointer-events-none vdocs:absolute vdocs:inset-0 vdocs:m-auto vdocs:hidden vdocs:peer-checked:block vdocs:text-white ${SIZE_CLASSES[size].check}`}
        />
      </span>
      {label && (
        <span className="vdocs:text-sm">
          {label}
        </span>
      )}
    </label>
  );
}
