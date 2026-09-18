import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The label for the button. */
  label: string;
  /** Optional prefix icon. */
  startIcon?: ReactNode;
  /** Optional suffix icon. */
  endIcon?: ReactNode;
  /** The size (height) of the button. */
  size?: 'xsmall' | 'small' | 'normal' | 'medium' | 'large';
  /** The display variant of the button. */
  variant?: 'standard' | 'text' | 'outline';
}

const SIZE_CLASSES = {
  xsmall: 'vdocs:h-6 vdocs:text-xs',
  small: 'vdocs:h-8 vdocs:text-[13px]',
  normal: 'vdocs:h-10 vdocs:text-sm',
  medium: 'vdocs:h-[46px] vdocs:text-[15px]',
  large: 'vdocs:h-[52px] vdocs:text-base',
};

// outline is the secondary/cancel role: a soft accent fill rather than a literal outline.
const VARIANT_CLASSES = {
  standard:
    'vdocs:bg-primary vdocs:text-white vdocs:border-none vdocs:rounded-ctl vdocs:shadow-xs vdocs:hover:bg-primary-dark vdocs:disabled:bg-disabled-fill vdocs:disabled:text-disabled vdocs:disabled:shadow-none',
  outline:
    'vdocs:bg-accent-tint vdocs:text-accent vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-accent-tint-dark vdocs:disabled:bg-disabled-fill vdocs:disabled:text-disabled',
  text: 'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled',
};

/**
 * A simple button, with consistent styling to other controls in the design system.
 */
export default function Button({
  label,
  startIcon,
  endIcon,
  size = 'normal',
  variant = 'standard',
  type = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`vdocs:font-sans vdocs:font-medium vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:disabled:cursor-default vdocs:disabled:pointer-events-none ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}>
      {startIcon && (
        <span className="vdocs:ml-2.5 vdocs:-mr-1.5 vdocs:[&>svg]:size-4">
          {startIcon}
        </span>
      )}
      <span className="vdocs:px-3.5">
        {label}
      </span>
      {endIcon && (
        <span className="vdocs:mr-2.5 vdocs:-ml-1.5 vdocs:[&>svg]:size-4">
          {endIcon}
        </span>
      )}
    </button>
  );
}
