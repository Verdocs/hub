import { useEffect, useRef, useState, type FC } from 'react';
import { CaretDownIcon } from './icons';

export interface IFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface QuickFilterProps {
  /** The filter options to display. */
  options: IFilterOption[];
  /** Prefix label shown before the selected value. */
  label?: string;
  /** The currently selected value. */
  value?: string;
  /** Shown when no option matches the current value. */
  placeholder?: string;
  /** Called when the user picks an option. */
  onChange?: (option: IFilterOption) => void;
}

/**
 * Display a drop-down menu of quick filter options, as a compact "Label: Value"
 * pill. Used above lists and tables.
 */
export const QuickFilter: FC<QuickFilterProps> = ({ options, label = 'Filter', value = '', placeholder = 'Select...', onChange }) => {
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

  const selectedOption = options.find(option => option.value === value);

  return (
    <div ref={containerRef} className="vdocs:relative vdocs:inline-block vdocs:font-sans">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:h-8 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:whitespace-nowrap vdocs:hover:border-muted">
        <span className="vdocs:text-muted">
          {label}
          :
        </span>
        {selectedOption ? selectedOption.label : placeholder}
        <span className="vdocs:border-l vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:ml-1" />
        <CaretDownIcon className="vdocs:size-5 vdocs:text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          className="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:min-w-full vdocs:w-max vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onClick={() => {
                setOpen(false);
                onChange?.(option);
              }}
              className={`vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:border-none vdocs:cursor-pointer vdocs:disabled:text-edge vdocs:disabled:cursor-default ${
                option.value === value ? 'vdocs:bg-canvas vdocs:text-accent vdocs:font-medium' : 'vdocs:bg-surface vdocs:text-ink vdocs:hover:bg-canvas'
              }`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
