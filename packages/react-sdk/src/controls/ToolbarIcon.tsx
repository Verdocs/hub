import { useId, useState, type ButtonHTMLAttributes, type FocusEventHandler, type MouseEventHandler, type ReactNode } from 'react';

export interface ToolbarIconProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Tooltip text to display on hover/focus. */
  text?: string;
  /** The icon to display. */
  icon: ReactNode;
  /** Which side of the icon the tooltip appears on. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_PLACEMENT_CLASSES = {
  top: 'vdocs:bottom-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mb-1.5',
  bottom: 'vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1.5',
  // The wider gap on the left matches the legacy offset used by the floating page menu.
  left: 'vdocs:right-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:mr-5',
  right: 'vdocs:left-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:ml-1.5',
};

const ARROW_PLACEMENT_CLASSES = {
  top: 'vdocs:bottom-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  bottom: 'vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  left: 'vdocs:right-[-4px] vdocs:top-1/2 vdocs:-mt-1',
  right: 'vdocs:left-[-4px] vdocs:top-1/2 vdocs:-mt-1',
};

/**
 * Displays a clickable toolbar icon. Upon hover or focus, a tooltip will be
 * displayed with the supplied text.
 */
export default function ToolbarIcon({
  text = '',
  icon,
  placement = 'bottom',
  type = 'button',
  className = '',
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: ToolbarIconProps) {
  const tooltipId = useId();
  const [showing, setShowing] = useState(false);

  const handleMouseEnter: MouseEventHandler<HTMLButtonElement> = e => {
    setShowing(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave: MouseEventHandler<HTMLButtonElement> = e => {
    setShowing(false);
    onMouseLeave?.(e);
  };

  const handleFocus: FocusEventHandler<HTMLButtonElement> = e => {
    setShowing(true);
    onFocus?.(e);
  };

  const handleBlur: FocusEventHandler<HTMLButtonElement> = e => {
    setShowing(false);
    onBlur?.(e);
  };

  return (
    <span className="vdocs:font-sans vdocs:relative vdocs:inline-flex vdocs:items-center vdocs:justify-center">
      <button
        type={type}
        aria-label={text || undefined}
        aria-describedby={tooltipId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-muted ${className}`}
        {...rest}>
        {icon}
      </button>

      {showing && !!text && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`vdocs:absolute vdocs:z-[20000] vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-[13px] vdocs:font-bold vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999] ${TOOLTIP_PLACEMENT_CLASSES[placement]}`}>
          {text}
          <span className={`vdocs:absolute vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface ${ARROW_PLACEMENT_CLASSES[placement]}`} />
        </span>
      )}
    </span>
  );
}
