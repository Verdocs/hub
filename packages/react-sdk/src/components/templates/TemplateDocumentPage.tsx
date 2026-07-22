import type { ComponentProps } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

export interface TemplateDocumentPageProps extends ComponentProps<'div'> {
  /** URL of the server-rendered page image. Omit to render a loading placeholder. */
  pageImageUri?: string;
  /** Page width in PDF points (72dpi). Defaults to 612, US Letter. */
  virtualWidth?: number;
  /** Page height in PDF points (72dpi). Defaults to 792, US Letter. */
  virtualHeight?: number;
  /** The 1-based page number, used for the image alt text. */
  pageNumber?: number;
}

/**
 * One document page, rendered as the server-side page image with a field layer
 * over it. Children render into the field layer and position themselves in the
 * page's own PDF-point coordinate system: absolute placement, `left` measured
 * from the page's left edge and `bottom` measured up from the page's bottom
 * edge, exactly as field x/y are stored.
 *
 * The legacy component scaled every field individually by the rendered/virtual
 * ratio. Here the whole field layer is laid out at the page's virtual size and
 * scaled once to the rendered width, which is the same math (the legacy x and
 * y scales were always equal) without each child needing to know the scale.
 * The pageRendered event existed to re-attach interact.js drag handlers, which
 * are not ported (docs/PORTING.md rule 6), so it is gone.
 */
export default function TemplateDocumentPage({
  pageImageUri,
  virtualWidth = 612,
  virtualHeight = 792,
  pageNumber = 1,
  children,
  className = '',
  style,
  ...rest
}: TemplateDocumentPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const measure = () => {
      const width = container.offsetWidth;
      if (width > 0) {
        setScale(width / virtualWidth);
      }
    };

    measure();

    // jsdom has no ResizeObserver; the initial measure above still runs there.
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [virtualWidth]);

  return (
    <div
      ref={containerRef}
      className={`vdocs:relative vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)] ${className}`}
      style={{ aspectRatio: `${virtualWidth} / ${virtualHeight}`, ...style }}
      {...rest}>
      {pageImageUri ? (
        <img
          src={pageImageUri}
          alt={`Page ${pageNumber}`}
          aria-hidden="true"
          loading="lazy"
          className="vdocs:absolute vdocs:inset-0 vdocs:size-full vdocs:select-none"
        />
      ) : (
        <div aria-hidden="true" data-testid="page-placeholder" className="vdocs:absolute vdocs:inset-0 vdocs:bg-canvas vdocs:animate-pulse" />
      )}

      <div
        className="vdocs:absolute vdocs:top-0 vdocs:left-0"
        style={{ width: virtualWidth, height: virtualHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}
