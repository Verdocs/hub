import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

export interface MenuPanelProps {
  /** Which side of the screen the panel slides in from. */
  side?: 'left' | 'right';
  /** Whether to dim the rest of the page behind the panel. */
  overlay?: boolean;
  /** The width of the panel in pixels. */
  width?: number;
  /** The panel content. */
  children?: ReactNode;
  /** Called when the user clicks outside the panel. */
  onClose?: () => void;
}

/**
 * Display a side panel that slides in from the edge of the screen, rendered into
 * document.body with an optional overlay dimming the rest of the page. Mount it to
 * show it: the parent unmounts the panel (typically from onClose) to dismiss it.
 *
 * ```tsx
 * {open && (
 *   <MenuPanel onClose={() => setOpen(false)}>
 *     <div>Panel content</div>
 *   </MenuPanel>
 * )}
 * ```
 */
export default function MenuPanel({ side = 'right', overlay = true, width = 300, children, onClose }: MenuPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onClose) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return createPortal(
    <>
      {overlay && <div aria-hidden="true" className="vdocs-menu-panel-overlay vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:bg-[#0000007f]" />}
      <div
        role="dialog"
        aria-modal={overlay}
        ref={panelRef}
        style={{ width }}
        className={`vdocs-menu-panel vdocs:fixed vdocs:top-0 vdocs:bottom-0 vdocs:z-[10001] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:transition vdocs:duration-[350ms] vdocs:translate-x-0 vdocs:opacity-100 vdocs:starting:opacity-0 ${
          side === 'right'
            ? 'vdocs:right-0 vdocs:starting:translate-x-full'
            : 'vdocs:left-0 vdocs:starting:-translate-x-full'
        }`}>
        {children}
      </div>
    </>,
    document.body,
  );
}
