import { useId, useState, type ReactNode } from 'react';
import { HelpCircleIcon } from './icons';

export interface HelpIconProps {
  /** Help text to display on hover/focus. */
  text?: ReactNode;
  /** Optional icon to display. If not supplied, a standard help icon will be shown. */
  icon?: ReactNode;
}

/**
 * Displays a simple help icon. Upon hover or focus, a tooltip will be displayed
 * with help text.
 */
export default function HelpIcon({ text = '', icon }: HelpIconProps) {
  const tooltipId = useId();
  const [showing, setShowing] = useState(false);

  return (
    <span className="vdocs:font-sans vdocs:relative vdocs:inline-block vdocs:opacity-30 vdocs:hover:opacity-100 vdocs:focus-within:opacity-100">
      <span
        role="img"
        aria-label="Help"
        aria-describedby={tooltipId}
        tabIndex={0}
        onMouseEnter={() => setShowing(true)}
        onMouseLeave={() => setShowing(false)}
        onFocus={() => setShowing(true)}
        onBlur={() => setShowing(false)}
        className="vdocs:inline-block vdocs:text-muted vdocs:outline-none">
        {icon ?? <HelpCircleIcon className="vdocs:size-6" />}
      </span>

      {showing && (
        <span
          id={tooltipId}
          role="tooltip"
          className="vdocs:absolute vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1 vdocs:z-[10005] vdocs:min-w-[200px] vdocs:max-w-[240px] vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-xs vdocs:font-medium vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999]">
          {text}
          <span className="vdocs:absolute vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1 vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface" />
        </span>
      )}
    </span>
  );
}
