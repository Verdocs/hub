import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';

/**
 * One document page, rendered as the server-side page image with a field layer
 * over it. Projected content renders into the field layer and positions itself
 * in the page's own PDF-point coordinate system: absolute placement, left
 * measured from the page's left edge and bottom measured up from the page's
 * bottom edge, exactly as field x/y are stored.
 *
 * The legacy component scaled every field individually by the rendered/virtual
 * ratio. Here the whole field layer is laid out at the page's virtual size and
 * scaled once to the rendered width, which is the same math (the legacy x and
 * y scales were always equal) without each child needing to know the scale.
 * The pageRendered event existed to re-attach interact.js drag handlers, which
 * are not ported (docs/PORTING.md rule 6), so it is gone.
 */
@Component({
  selector: 'verdocs-template-document-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vdocs:relative vdocs:block vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)]',
    '[style.aspectRatio]': 'virtualWidth() + " / " + virtualHeight()',
  },
  template: `
    @if (pageImageUri(); as uri) {
      <img
        [src]="uri"
        [alt]="'Page ' + pageNumber()"
        aria-hidden="true"
        loading="lazy"
        class="vdocs:absolute vdocs:inset-0 vdocs:size-full vdocs:select-none" />
    } @else {
      <div aria-hidden="true" data-testid="page-placeholder" class="vdocs:absolute vdocs:inset-0 vdocs:bg-canvas vdocs:animate-pulse"></div>
    }

    <div
      class="vdocs:absolute vdocs:top-0 vdocs:left-0"
      style="transform-origin: top left"
      [style.width.px]="virtualWidth()"
      [style.height.px]="virtualHeight()"
      [style.transform]="'scale(' + scale() + ')'">
      <ng-content />
    </div>
  `,
})
export class VerdocsTemplateDocumentPageComponent {
  /** URL of the server-rendered page image. Omit to render a loading placeholder. */
  readonly pageImageUri = input<string>();
  /** Page width in PDF points (72dpi). Defaults to 612, US Letter. */
  readonly virtualWidth = input(612);
  /** Page height in PDF points (72dpi). Defaults to 792, US Letter. */
  readonly virtualHeight = input(792);
  /** The 1-based page number, used for the image alt text. */
  readonly pageNumber = input(1);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly renderedWidth = signal(0);

  protected readonly scale = computed(() => {
    const width = this.renderedWidth();
    return width > 0 ? width / this.virtualWidth() : 1;
  });

  constructor() {
    const measure = () => {
      const width = this.host.nativeElement.offsetWidth;
      if (width > 0) {
        this.renderedWidth.set(width);
      }
    };

    afterNextRender(measure);

    // jsdom has no ResizeObserver; the initial measure above still runs there.
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(this.host.nativeElement);
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }
}
