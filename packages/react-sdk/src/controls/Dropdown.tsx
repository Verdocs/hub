import { useEffect, useRef, useState } from 'react';
import { MenuArrowIcon } from './icons';

export interface IMenuOption {
  /** The label to display. Options with an empty label render as separators. */
  label: string;
  /** Identifier passed to onSelect when the option is chosen. */
  id?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  /** The menu options to display. */
  options: IMenuOption[];
  /** Called when the user picks an option. */
  onSelect?: (option: IMenuOption) => void;
}

/**
 * Display a drop-down menu button. A menu of the specified options is shown
 * when the button is pressed, and hidden when an option is selected or the
 * user clicks elsewhere. Separators may be created by supplying an entry with
 * an empty label.
 */
export default function Dropdown({ options, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="vdocs:relative vdocs:inline-block vdocs:font-sans">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={e => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:rounded-ctl vdocs:cursor-pointer vdocs:text-primary vdocs:hover:bg-canvas">
        <MenuArrowIcon className="vdocs:size-6" />
      </button>

      {open && (
        <div
          role="menu"
          className="vdocs:absolute vdocs:right-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-40 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
          {options.map((option, index) =>
            option.label ? (
              <button
                key={option.id ?? option.label}
                type="button"
                role="menuitem"
                disabled={option.disabled}
                onClick={e => {
                  e.stopPropagation();
                  setOpen(false);
                  onSelect?.(option);
                }}
                className="vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border-none vdocs:cursor-pointer vdocs:hover:bg-canvas vdocs:disabled:text-edge vdocs:disabled:cursor-default vdocs:disabled:bg-surface">
                {option.label}
              </button>
            ) : (
              <div key={`separator-${index}`} className="vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:my-1" />
            ))}
        </div>
      )}
    </div>
  );
}
