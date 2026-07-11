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
  xsmall: 'vdocs:h-[26px] vdocs:text-xs',
  small: 'vdocs:h-[34px] vdocs:text-[13px]',
  normal: 'vdocs:h-11 vdocs:text-sm',
  medium: 'vdocs:h-[52px] vdocs:text-base',
  large: 'vdocs:h-[60px] vdocs:text-xl',
};

const VARIANT_CLASSES = {
  standard:
    'vdocs:bg-primary vdocs:text-white vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary-dark vdocs:disabled:bg-disabled vdocs:disabled:text-white/70',
  outline:
    'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border vdocs:border-solid vdocs:border-primary vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled vdocs:disabled:border-disabled',
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
      className={`vdocs:font-sans vdocs:font-medium vdocs:cursor-pointer vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:disabled:cursor-default vdocs:disabled:pointer-events-none ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}>
      {startIcon && (
        <span className="vdocs:mx-1 vdocs:[&>svg]:size-5">
          {startIcon}
        </span>
      )}
      <span className="vdocs:px-2.5">
        {label}
      </span>
      {endIcon && (
        <span className="vdocs:mx-1 vdocs:[&>svg]:size-5">
          {endIcon}
        </span>
      )}
    </button>
  );
}
