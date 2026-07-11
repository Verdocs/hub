import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/** Geometry for a rendered page, reported through vdocs-page-rendered. */
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

/**
 * One envelope document page: the page image with an overlay layer for
 * positioning page-related content such as signing fields. Primarily a layout
 * container; it renders whatever markup children the caller supplies (consumed
 * once, when the element first connects, since light DOM has no slots) into an
 * absolutely-positioned overlay, and reports its geometry so the caller can
 * convert field coordinates from page space to screen space.
 *
 * ```html
 * <vdocs-envelope-document-page page-image-uri="https://..." page-number="1">
 *   <div style="position:absolute; left:10%; top:20%">A field</div>
 * </vdocs-envelope-document-page>
 * ```
 *
 * @fires vdocs-page-rendered - Fired with an IDocumentPageInfo when the image loads and whenever the rendered size changes.
 */
export class VdocsEnvelopeDocumentPage extends VdocsElement {
  static override properties = {
    pageImageUri: { type: String, attribute: 'page-image-uri' },
    pageNumber: { type: Number, attribute: 'page-number' },
    virtualWidth: { type: Number, attribute: 'virtual-width' },
    virtualHeight: { type: Number, attribute: 'virtual-height' },
  };

  /** The URI of the page image to display. The caller resolves it, e.g. via getEnvelopeDocumentPageDisplayUri(). */
  declare pageImageUri: string;
  /** The page number being rendered (1-based). Echoed in vdocs-page-rendered and the image alt text. */
  declare pageNumber: number;
  /** The virtual width of the page canvas fields are positioned against. Defaults to 612 (8.5in at 72dpi). */
  declare virtualWidth: number;
  /** The virtual height of the page canvas. Defaults to 792 (11in at 72dpi). Reserves layout space before the image loads. */
  declare virtualHeight: number;

  private containerRef = createRef<HTMLDivElement>();
  private overlayRef = createRef<HTMLDivElement>();
  private content?: ChildNode[];
  private naturalWidth = 0;
  private naturalHeight = 0;
  private observer?: ResizeObserver;
  private resizeTimer = 0;

  constructor() {
    super();
    this.pageImageUri = '';
    this.pageNumber = 1;
    this.virtualWidth = 612;
    this.virtualHeight = 792;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');

    // Markup children are the overlay content (typically signing fields). We
    // consume them once, before Lit's first render, because render() owns the
    // element's whole subtree; later connects reuse the same nodes.
    this.content ??= Array.from(this.childNodes);
  }

  override firstUpdated() {
    const container = this.containerRef.value;
    if (!container) {
      return;
    }

    // Resize streams fire every frame while the user drags, and each
    // notification makes the caller re-place every overlay child, so let the
    // size settle for 100ms first.
    this.observer = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.notify(), 100);
    });
    this.observer.observe(container);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.resizeTimer);
    this.observer?.disconnect();
    this.observer = undefined;

    // Return the content so the element still owns it if the host re-attaches us.
    const overlay = this.overlayRef.value;
    if (overlay && this.content) {
      this.append(...this.content);
    }
  }

  override updated() {
    // The overlay's markup children are moved into the ref'd container
    // imperatively, never through a Lit ChildPart, the same way vdocs-dialog
    // handles its body: Lit leaves a static ref'd div's children untouched
    // across re-renders.
    const overlay = this.overlayRef.value;
    if (overlay && this.content && this.content[0] && !overlay.contains(this.content[0])) {
      overlay.append(...this.content);
    }
  }

  private handleImageLoad(e: Event) {
    const img = e.target as HTMLImageElement;
    this.naturalWidth = img.naturalWidth;
    this.naturalHeight = img.naturalHeight;
    this.notify();
  }

  private notify() {
    const container = this.containerRef.value;
    if (!container || !this.naturalWidth || !this.naturalHeight) {
      return;
    }

    // All we really care about from the image is its aspect ratio. Fields are
    // placed against a virtualWidth-wide page, so for non-letter pages the
    // virtual height is derived from the real aspect ratio rather than trusting
    // the 8.5x11 default.
    const aspectRatio = this.naturalWidth / this.naturalHeight;
    const effectiveVirtualHeight = this.virtualWidth / aspectRatio;
    const renderedWidth = container.offsetWidth;
    const renderedHeight = renderedWidth / aspectRatio;

    this.emit<IDocumentPageInfo>('vdocs-page-rendered', {
      pageNumber: this.pageNumber,
      virtualWidth: this.virtualWidth,
      virtualHeight: effectiveVirtualHeight,
      renderedWidth,
      renderedHeight,
      naturalWidth: this.naturalWidth,
      naturalHeight: this.naturalHeight,
      aspectRatio,
      xScale: renderedWidth / this.virtualWidth,
      yScale: renderedHeight / effectiveVirtualHeight,
    });
  }

  override render() {
    return html`
      <div ${ref(this.containerRef)} class="vdocs:relative vdocs:w-full">
        <img
          src=${this.pageImageUri}
          alt=${`Page ${this.pageNumber}`}
          loading="lazy"
          style=${`aspect-ratio: auto ${this.virtualWidth} / ${this.virtualHeight}`}
          class="vdocs:block vdocs:h-auto vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)]"
          @load=${this.handleImageLoad} />
        <div ${ref(this.overlayRef)} class="vdocs:absolute vdocs:inset-0"></div>
      </div>`;
  }
}

register('vdocs-envelope-document-page', VdocsEnvelopeDocumentPage);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-envelope-document-page': VdocsEnvelopeDocumentPage;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-page-rendered': CustomEvent<IDocumentPageInfo>;
  }
}
