import { createPortal } from 'react-dom';
import type { ReactNode, RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface PortalProps {
  /** The element the floating content is anchored to, or a ref holding it. */
  anchor: HTMLElement | RefObject<HTMLElement | null> | null;
  /** The floating content. */
  children?: ReactNode;
  /** Called when the user clicks outside both the content and the anchor. */
  onClickAway?: () => void;
}

function resolveAnchor(anchor: PortalProps['anchor']) {
  if (!anchor) {
    return null;
  }

  return anchor instanceof HTMLElement ? anchor : anchor.current;
}

// Keeps the wrapper aligned to the anchor: below it and left-aligned when it fits,
// flipped above when it would cross the bottom of the viewport, pulled back from the
// right edge when it would overflow. The scroll listener is capture-phase so scrolling
// any ancestor container repositions the content, not just the window.
function usePortalPosition(anchor: PortalProps['anchor'], contentRef: RefObject<HTMLDivElement | null>) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const anchorEl = resolveAnchor(anchor);
      const contentEl = contentRef.current;
      if (!anchorEl || !contentEl) {
        return;
      }

      const anchorRect = anchorEl.getBoundingClientRect();

      let left = Math.max(anchorRect.left, 0);
      if (left + contentEl.offsetWidth > window.innerWidth) {
        left = Math.max(window.innerWidth - contentEl.offsetWidth - 20, 0);
      }

      let top = anchorRect.bottom;
      if (top + contentEl.offsetHeight > window.innerHeight) {
        top = anchorRect.top - contentEl.offsetHeight;
      }

      setPosition(previous => (previous.top === top && previous.left === left ? previous : { top, left }));
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchor, contentRef]);

  return position;
}

/**
 * Display floating content anchored to another element. The content renders into
 * document.body so it escapes any overflow or stacking context set by its parents,
 * and repositions itself as the page scrolls or resizes. Mount it conditionally:
 * rendering the portal shows the content.
 *
 * ```tsx
 * {open && (
 *   <Portal anchor={buttonRef} onClickAway={() => setOpen(false)}>
 *     <div>Floating content</div>
 *   </Portal>
 * )}
 * ```
 */
export default function Portal({ anchor, children, onClickAway }: PortalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const position = usePortalPosition(anchor, contentRef);

  useEffect(() => {
    if (!onClickAway) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // Clicks on the anchor are the caller's own toggle, not a click-away. Clicks
      // inside any portal wrapper are skipped too: floating content can open nested
      // portals whose DOM is a sibling of ours in document.body, not a descendant.
      if (contentRef.current?.contains(target) || resolveAnchor(anchor)?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest('.vdocs-portal')) {
        return;
      }

      onClickAway();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [anchor, onClickAway]);

  return createPortal(
    <div
      ref={contentRef}
      style={{ top: position.top, left: position.left }}
      className="vdocs-portal vdocs:fixed vdocs:z-[10001]">
      {children}
    </div>,
    document.body,
  );
}
