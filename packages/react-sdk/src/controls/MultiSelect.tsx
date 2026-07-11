import { useEffect, useId, useRef, useState } from 'react';
import { CaretDownIcon } from './icons';

export interface IMultiSelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value tracked in selectedOptions. */
  value: string;
}

export interface MultiSelectProps {
  /** The label for the field. */
  label?: string;
  /** Shown in the trigger when no options are selected. */
  placeholder?: string;
  /** The options to list. */
  options: IMultiSelectOption[];
  /** The values currently selected. */
  selectedOptions?: string[];
  /** Called with the new selection when the user toggles an option. */
  onSelectionChanged?: (selectedOptions: string[]) => void;
}

/**
 * Display a dropdown that allows multiple options to be selected. The trigger
 * summarizes the current selection; pressing it opens a checkbox list that
 * stays open while the user toggles options and closes on an outside click or
 * Escape. This is a controlled component: supply selectedOptions and
 * onSelectionChanged.
 */
export default function MultiSelect({ label, placeholder = 'Select...', options, selectedOptions = [], onSelectionChanged }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleToggleOption = (option: IMultiSelectOption, checked: boolean) => {
    const next = checked ? [...selectedOptions, option.value] : selectedOptions.filter(selected => selected !== option.value);
    onSelectionChanged?.(next);
  };

  return (
    <div ref={containerRef} className="vdocs:block vdocs:w-full vdocs:font-sans vdocs:mb-2.5">
      {label && (
        <div id={labelId} className="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          {label}
          :
        </div>
      )}

      <div className="vdocs:relative">
        <button
          type="button"
          aria-expanded={open}
          aria-labelledby={label ? labelId : undefined}
          onClick={() => setOpen(!open)}
          className="vdocs:relative vdocs:flex vdocs:flex-wrap vdocs:items-center vdocs:gap-1 vdocs:w-full vdocs:min-h-10 vdocs:box-border vdocs:pl-2.5 vdocs:pr-8 vdocs:py-1 vdocs:text-sm vdocs:text-left vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:outline-none vdocs:focus:border-accent">
          {selectedOptions.length === 0 ? (
            <span className="vdocs:text-muted">
              {placeholder}
            </span>
          ) : (
            selectedOptions.map(value => (
              <span key={value} className="vdocs:inline-block vdocs:px-1.5 vdocs:py-0.5 vdocs:text-xs vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-ctl">
                {options.find(option => option.value === value)?.label || 'Unknown'}
              </span>
            ))
          )}
          <CaretDownIcon
            className={`vdocs:absolute vdocs:right-2 vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:size-4.5 vdocs:text-muted ${open ? 'vdocs:rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div
            role="group"
            aria-labelledby={label ? labelId : undefined}
            className="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-52 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
            {options.map(option => (
              <label
                key={option.value}
                className="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:px-2 vdocs:py-1.5 vdocs:text-[13px] vdocs:text-ink vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:hover:bg-canvas">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.value)}
                  onChange={e => handleToggleOption(option, e.target.checked)}
                  className="vdocs:size-4 vdocs:accent-primary vdocs:cursor-pointer"
                />
                {option.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
