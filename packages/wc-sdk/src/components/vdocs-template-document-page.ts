import { html } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * One document page, rendered as the server-side page image with a field layer
 * over it. The field layer is supplied through the `content` property (a Lit
 * template): its children position themselves in the page's own PDF-point
 * coordinate system, `left` measured from the page's left edge and `bottom`
 * measured up from the bottom, exactly as field x/y are stored.
 *
 * Like the react-sdk port, the whole field layer is laid out at the page's
 * virtual size and scaled once to the rendered width (the x and y scales are
 * always equal), so each child does not need to know the scale. Composition is
 * property-driven rather than slot-based because light-DOM slots are inert
 * (docs/standards/web-components.md rule 6); vdocs-template-fields builds the
 * positioned field elements and passes them as `content`.
 */
export class VdocsTemplateDocumentPage extends VdocsElement {
  static override properties = {
    pageImageUri: { type: String, attribute: 'page-image-uri' },
    virtualWidth: { type: Number, attribute: 'virtual-width' },
    virtualHeight: { type: Number, attribute: 'virtual-height' },
    pageNumber: { type: Number, attribute: 'page-number' },
    content: { attribute: false },
    scale: { state: true },
  };

  /** URL of the server-rendered page image. Omit to render a loading placeholder. */
  declare pageImageUri: string;
  /** Page width in PDF points (72dpi). Defaults to 612, US Letter. */
  declare virtualWidth: number;
  /** Page height in PDF points (72dpi). Defaults to 792, US Letter. */
  declare virtualHeight: number;
  /** The 1-based page number, used for the image alt text. */
  declare pageNumber: number;
  /** The field layer template, positioned in the page's PDF-point coordinates. Property-only. */
  declare content?: TemplateResult;

  private declare scale: number;
  private observer?: ResizeObserver;

  constructor() {
    super();
    this.pageImageUri = '';
    this.virtualWidth = 612;
    this.virtualHeight = 792;
    this.pageNumber = 1;
    this.scale = 1;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override firstUpdated() {
    const container = this.container;
    if (!container) {
      return;
    }

    this.measure();

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(container);
    }
  }

  override updated(changed: PropertyValues<this>) {
    // A different page can have a different virtual width, so re-fit when it changes.
    if (changed.has('virtualWidth')) {
      this.measure();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private get container() {
    return this.querySelector<HTMLElement>('[data-page-container]');
  }

  private measure() {
    const width = this.container?.offsetWidth ?? 0;
    if (width > 0) {
      const next = width / this.virtualWidth;
      // Skip no-op sets so a ResizeObserver callback that reports the same width
      // does not schedule a redundant update.
      if (next !== this.scale) {
        this.scale = next;
      }
    }
  }

  override render() {
    return html`
      <div
        data-page-container
        class="vdocs:relative vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)]"
        style="aspect-ratio: ${this.virtualWidth} / ${this.virtualHeight}">
        ${this.pageImageUri ?
          html`
            <img
              src=${this.pageImageUri}
              alt=${`Page ${this.pageNumber}`}
              aria-hidden="true"
              loading="lazy"
              class="vdocs:absolute vdocs:inset-0 vdocs:size-full vdocs:select-none" />` :
          html`<div aria-hidden="true" data-testid="page-placeholder" class="vdocs:absolute vdocs:inset-0 vdocs:bg-canvas vdocs:animate-pulse"></div>`}

        <div
          class="vdocs:absolute vdocs:top-0 vdocs:left-0"
          style="width: ${this.virtualWidth}px; height: ${this.virtualHeight}px; transform: scale(${this.scale}); transform-origin: top left;">
          ${this.content}
        </div>
      </div>`;
  }
}

register('vdocs-template-document-page', VdocsTemplateDocumentPage);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-document-page': VdocsTemplateDocumentPage;
  }
}
