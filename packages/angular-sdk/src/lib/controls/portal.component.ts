import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  viewChild,
} from '@angular/core';

/**
 * Display floating content anchored to another element. The content renders into
 * document.body so it escapes any overflow or stacking context set by its parents,
 * and repositions itself as the page scrolls or resizes. Mount it conditionally:
 * rendering the portal shows the content. React's onClickAway callback is this
 * component's clickAway output.
 *
 * ```html
 * <button #trigger (click)="open.set(!open())">Toggle</button>
 * @if (open()) {
 *   <verdocs-portal [anchor]="trigger" (clickAway)="open.set(false)">
 *     <div>Floating content</div>
 *   </verdocs-portal>
 * }
 * ```
 */
@Component({
  selector: 'verdocs-portal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // The host is just a marker left at the declaration site; the content div
    // moves to document.body. Hiding the host keeps the pre-move render from
    // shifting layout.
    '[style.display]': `'none'`,
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div #content class="vdocs-portal vdocs:fixed vdocs:z-[10001]">
      <ng-content />
    </div>
  `,
})
export class VerdocsPortalComponent {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);

  /** The element the floating content is anchored to. A template reference variable works: [anchor]="myButton". */
  readonly anchor = input.required<HTMLElement | ElementRef<HTMLElement> | null>();

  /** Emitted when the user clicks outside both the content and the anchor. */
  readonly clickAway = output<void>();

  private readonly content = viewChild<ElementRef<HTMLDivElement>>('content');

  // View teardown only detaches nodes from where Angular thinks they are, which
  // is no longer true once we move the div, so we track it and remove it ourselves.
  private movedEl: HTMLDivElement | null = null;

  constructor() {
    afterNextRender(() => {
      const contentEl = this.content()?.nativeElement;
      if (contentEl) {
        this.movedEl = contentEl;
        this.renderer.appendChild(this.document.body, contentEl);
      }
      this.updatePosition();
    });

    // Reposition when the anchor changes. Scroll and resize need manual
    // listeners: scroll is capture-phase so scrolling any ancestor container
    // repositions the content, not just the window, and host bindings cannot
    // express capture.
    effect(() => {
      this.anchor();
      this.updatePosition();
    });

    const update = () => this.updatePosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      this.movedEl?.remove();
    });
  }

  private anchorElement() {
    const anchor = this.anchor();
    return anchor instanceof ElementRef ? anchor.nativeElement : anchor;
  }

  // Keeps the wrapper aligned to the anchor: below it and left-aligned when it fits,
  // flipped above when it would cross the bottom of the viewport, pulled back from
  // the right edge when it would overflow.
  private updatePosition() {
    const anchorEl = this.anchorElement();
    const contentEl = this.content()?.nativeElement;
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

    this.renderer.setStyle(contentEl, 'top', `${top}px`);
    this.renderer.setStyle(contentEl, 'left', `${left}px`);
  }

  protected onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;

    // Clicks on the anchor are the caller's own toggle, not a click-away. Clicks
    // inside any portal wrapper are skipped too: floating content can open nested
    // portals whose DOM is a sibling of ours in document.body, not a descendant.
    if (this.content()?.nativeElement.contains(target) || this.anchorElement()?.contains(target)) {
      return;
    }

    if (target instanceof Element && target.closest('.vdocs-portal')) {
      return;
    }

    this.clickAway.emit();
  }
}
