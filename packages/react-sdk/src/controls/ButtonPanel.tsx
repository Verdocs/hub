import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import Portal from './Portal';

export interface ButtonPanelProps {
  /** The icon rendered as the trigger button face. */
  icon: ReactNode;
  /** Accessible name for the trigger button and its panel. */
  label?: string;
  /** The panel content. */
  children?: ReactNode;
}

/**
 * Display an icon button that opens a floating panel of arbitrary content, such
 * as settings forms or metadata. The panel is anchored to the button and closes
 * when the user clicks anywhere outside it.
 *
 * ```tsx
 * <ButtonPanel icon={<SettingsIcon />} label="Field settings">
 *   <div>Field Settings</div>
 * </ButtonPanel>
 * ```
 */
export default function ButtonPanel({ icon, label = 'Open panel', children }: ButtonPanelProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="vdocs:inline-block vdocs:font-sans">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        className="vdocs:inline-flex vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:opacity-60 vdocs:text-accent-light vdocs:hover:opacity-100 vdocs:[&_svg]:fill-current">
        {icon}
      </button>

      {open && (
        <Portal anchor={triggerRef} onClickAway={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label={label}
            className="vdocs:w-80 vdocs:p-[15px] vdocs:text-sm vdocs:font-bold vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:rounded-ctl vdocs:shadow-lg">
            {children}
          </div>
        </Portal>
      )}
    </div>
  );
}
