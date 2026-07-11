import { useState, type ReactNode } from 'react';

export interface IToggleButton {
  /** Identifier for the button, reported to onChange. */
  id: string;
  /** Accessible name for the button. */
  label: string;
  /** Icon content for the button face. Icons render at 30px and inherit the current text color. */
  icon: ReactNode;
}

export interface ToggleProps {
  /** Optional heading label displayed before the buttons. Also names the group for assistive tech. */
  label?: string;
  /** The buttons to display. */
  buttons: IToggleButton[];
  /** Index of the initially selected button, for uncontrolled use. Defaults to 0. */
  defaultSelection?: number;
  /** Index of the selected button. Set this to control the selection. */
  selection?: number;
  /** Called when the user selects a button. */
  onChange?: (button: IToggleButton, index: number) => void;
}

/**
 * A group of icon buttons where exactly one is selected at a time, with an
 * optional heading label. Leave selection unset for uncontrolled use with
 * defaultSelection.
 */
export default function Toggle({ label, buttons, defaultSelection = 0, selection, onChange }: ToggleProps) {
  const [internalSelection, setInternalSelection] = useState(defaultSelection);
  const selectedIndex = selection ?? internalSelection;

  const handleSelect = (button: IToggleButton, index: number) => {
    setInternalSelection(index);
    onChange?.(button, index);
  };

  return (
    <div role="group" aria-label={label} className="vdocs:flex vdocs:items-center vdocs:bg-canvas vdocs:font-sans">
      {label && (
        <span className="vdocs:text-2xl vdocs:font-bold vdocs:text-ink vdocs:mr-7">
          {label}
          :
        </span>
      )}
      <div className="vdocs:flex vdocs:gap-[11px]">
        {buttons.map((button, index) => (
          <button
            key={button.id}
            type="button"
            aria-label={button.label}
            aria-pressed={index === selectedIndex}
            onClick={() => handleSelect(button, index)}
            className={`vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-[60px] vdocs:p-0 vdocs:border-2 vdocs:border-solid vdocs:border-accent vdocs:rounded-row vdocs:cursor-pointer vdocs:transition-colors vdocs:duration-200 vdocs:[&_svg]:size-[30px] vdocs:hover:bg-accent vdocs:hover:text-canvas ${
              index === selectedIndex ? 'vdocs:bg-accent-light vdocs:text-white' : 'vdocs:bg-surface vdocs:text-ink'
            }`}>
            {button.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
