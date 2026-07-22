import type { MouseEvent, ReactNode } from 'react';

export interface ToggleButtonProps {
  /** Whether the button renders pressed. This is a controlled prop. */
  active?: boolean;
  /** Icon to render as the button face. When set, label becomes the accessible name only. */
  icon?: ReactNode;
  /** Text to render as the button face when no icon is given. */
  label?: string;
  /** Small buttons suit dialogs and other compact regions. */
  size?: 'small' | 'normal';
  /** Called with the requested state when the button is clicked. */
  onToggle?: (active: boolean) => void;
}

const SIZE_CLASSES = {
  normal: 'vdocs:size-10 vdocs:p-1.5 vdocs:rounded-ctl',
  small: 'vdocs:size-[34px] vdocs:p-1 vdocs:rounded-[2px]',
};

/**
 * Display a single button that can be toggled on and off by clicking it. This is a
 * controlled component: the parent owns active and updates it as onToggle fires.
 *
 * ```tsx
 * <ToggleButton icon={<MessageIcon />} label="Messages" active={active} onToggle={setActive} />
 * ```
 */
export default function ToggleButton({ active = false, icon, label, size = 'normal', onToggle }: ToggleButtonProps) {
  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    // The legacy control stopped propagation so a toggle never doubles as a click on
    // whatever hosts the button (field toolbars). Keep that contract.
    e.stopPropagation();
    onToggle?.(!active);
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={icon && label ? label : undefined}
      onClick={handleToggle}
      className={`vdocs:font-sans vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:cursor-pointer vdocs:[&_svg]:max-w-full vdocs:[&_svg]:max-h-full vdocs:[&_svg]:fill-current ${SIZE_CLASSES[size]} ${
        active
          ? 'vdocs:bg-primary vdocs:text-canvas'
          : 'vdocs:bg-edge-light vdocs:text-ink'
      }`}>
      {icon ?? label}
    </button>
  );
}
