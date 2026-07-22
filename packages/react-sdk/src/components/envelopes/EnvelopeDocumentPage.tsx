import { useEffect, useRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

/** Geometry for a rendered page, reported through onPageRendered. */
export interface IDocumentPageInfo {
  pageNumber: number;
  virtualWidth: number;
  virtualHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  xScale: number;
  yScale: number;
}

export interface EnvelopeDocumentPageProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The URI of the page image to display. The caller resolves it, e.g. via
   * `getEnvelopeDocumentPageDisplayUri()` in the JS SDK.
   */
  pageImageUri: string;
  /** The page number being rendered (1-based). Echoed in onPageRendered and the image alt text. */
  pageNumber?: number;
  /**
   * The "virtual" width of the page canvas fields are positioned against. Defaults to 612,
   * which at 72dpi is 8.5" wide. Used to compute the x/y scale factors when scaling up/down.
   */
  virtualWidth?: number;
  /**
   * The "virtual" height of the page canvas. Defaults to 792, which at 72dpi is 11" tall.
   * Reserves layout space before the image loads; once it loads, the reported virtual
   * height follows the image's real aspect ratio for non-letter pages.
   */
  virtualHeight?: number;
  /**
   * Overlay content, typically signing fields. Rendered into a layer absolutely positioned
   * over the page image, so children using absolute left/top offsets land on the page.
   */
  children?: ReactNode;
  /**
   * Called when the page image loads and again whenever the rendered size changes. The
   * geometry includes the x/y scale factors callers need to position overlay children.
   */
  onPageRendered?: (info: IDocumentPageInfo) => void;
}

/**
 * One envelope document page: the page image with an overlay layer for positioning
 * page-related content such as signing fields. This is primarily a layout container;
 * it renders whatever children the caller supplies and reports its geometry so the
 * caller can convert field coordinates from page space to screen space.
 */
export default function EnvelopeDocumentPage({
  pageImageUri,
  pageNumber = 1,
  virtualWidth = 612,
  virtualHeight = 792,
  onPageRendered,
  children,
  className = '',
  ...rest
}: EnvelopeDocumentPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const naturalSizeRef = useRef<{ width: number; height: number } | null>(null);

  // The notify path reads everything through refs so the resize observer can be
  // registered once and still see current props.
  const geometryRef = useRef({ pageNumber, virtualWidth, onPageRendered });
  geometryRef.current = { pageNumber, virtualWidth, onPageRendered };

  const notifyRef = useRef(() => {
    const container = containerRef.current;
    const natural = naturalSizeRef.current;
    if (!container || !natural?.width || !natural?.height) {
      return;
    }

    // All we really care about from the image is its aspect ratio. Builder places fields
    // against a virtualWidth-wide page, so for non-letter pages the virtual height is
    // derived from the real aspect ratio rather than trusting the 8.5x11 default.
    const { pageNumber: page, virtualWidth: vWidth, onPageRendered: notify } = geometryRef.current;
    const aspectRatio = natural.width / natural.height;
    const effectiveVirtualHeight = vWidth / aspectRatio;
    const renderedWidth = container.offsetWidth;
    const renderedHeight = renderedWidth / aspectRatio;

    notify?.({
      pageNumber: page,
      virtualWidth: vWidth,
      virtualHeight: effectiveVirtualHeight,
      renderedWidth,
      renderedHeight,
      naturalWidth: natural.width,
      naturalHeight: natural.height,
      aspectRatio,
      xScale: renderedWidth / vWidth,
      yScale: renderedHeight / effectiveVirtualHeight,
    });
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Resize streams fire every frame while the user drags, and each notification makes
    // the caller re-place every overlay child, so let the size settle for 100ms first.
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => notifyRef.current(), 100);
    });
    observer.observe(container);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`vdocs:relative vdocs:w-full ${className}`} {...rest}>
      <img
        src={pageImageUri}
        alt={`Page ${pageNumber}`}
        loading="lazy"
        // 'auto' keeps the image's own ratio once it loads; the virtual ratio only
        // reserves layout space beforehand so the page list doesn't jump.
        style={{ aspectRatio: `auto ${virtualWidth} / ${virtualHeight}` }}
        className="vdocs:block vdocs:h-auto vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)]"
        onLoad={e => {
          naturalSizeRef.current = { width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight };
          notifyRef.current();
        }}
      />
      <div className="vdocs:absolute vdocs:inset-0">
        {children}
      </div>
    </div>
  );
}
