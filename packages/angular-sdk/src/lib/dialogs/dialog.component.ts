import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  TemplateRef,
  viewChild,
} from '@angular/core';

/**
 * The base modal dialog: a centered panel over a dimmed overlay, rendered into
 * document.body so it escapes any overflow or stacking context set by its
 * parents. The other dialogs compose this and supply heading, body, and footer
 * content. Dismissal is the caller's job: mount it conditionally and clear
 * your own state from the closed event (React's onClose).
 *
 * The body projects through ng-content. The heading and footer are inputs
 * rather than projection slots so the header row and footer padding only
 * render when content was actually supplied, matching the React component's
 * "prop is undefined" semantics without marker directives. Strings get the
 * title treatment; a TemplateRef covers rich headings (the KBA dialog's step
 * counter) and every footer.
 *
 * ```html
 * <verdocs-dialog heading="Are you sure?" [footer]="footerTpl" (closed)="open.set(false)">
 *   Body content
 * </verdocs-dialog>
 * <ng-template #footerTpl><verdocs-button label="OK" (click)="confirm()" /></ng-template>
 * ```
 */
@Component({
  selector: 'verdocs-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ NgTemplateOutlet ],
  host: {
    // The host is just a marker left at the declaration site; the overlay div
    // moves to document.body. Hiding the host keeps the pre-move render from
    // shifting layout.
    '[style.display]': `'none'`,
  },
  template: `
    <div
      #content
      class="vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:flex vdocs:items-center vdocs:justify-center vdocs:bg-ink/40 vdocs:font-sans vdocs:box-border"
      (click)="onOverlayClick($event)">
      <div
        role="dialog"
        aria-modal="true"
        class="vdocs:relative vdocs:flex vdocs:w-[520px] vdocs:max-w-[95%] vdocs:flex-col vdocs:overflow-hidden vdocs:rounded-lg vdocs:bg-surface vdocs:shadow-lg">
        <button
          type="button"
          aria-label="Close"
          (click)="closed.emit()"
          class="vdocs:absolute vdocs:top-4 vdocs:right-4 vdocs:z-20 vdocs:flex vdocs:size-6 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:text-edge vdocs:transition-colors vdocs:hover:text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.881 122.88" fill="currentColor" class="vdocs:size-5" aria-hidden="true">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M61.44,0c33.933,0,61.441,27.507,61.441,61.439 c0,33.933-27.508,61.44-61.441,61.44C27.508,122.88,0,95.372,0,61.439C0,27.507,27.508,0,61.44,0L61.44,0z M81.719,36.226 c1.363-1.363,3.572-1.363,4.936,0c1.363,1.363,1.363,3.573,0,4.936L66.375,61.439l20.279,20.278c1.363,1.363,1.363,3.573,0,4.937 c-1.363,1.362-3.572,1.362-4.936,0L61.44,66.376L41.162,86.654c-1.362,1.362-3.573,1.362-4.936,0c-1.363-1.363-1.363-3.573,0-4.937 l20.278-20.278L36.226,41.162c-1.363-1.363-1.363-3.573,0-4.936c1.363-1.363,3.573-1.363,4.936,0L61.44,56.504L81.719,36.226 L81.719,36.226z" />
          </svg>
        </button>

        @if (heading() !== null) {
          <div class="vdocs:flex vdocs:items-center vdocs:justify-between vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-6 vdocs:py-4">
            <div class="vdocs:text-2xl vdocs:font-medium vdocs:text-ink vdocs:leading-8">
              @if (headingTemplate(); as tpl) {
                <ng-container [ngTemplateOutlet]="tpl" />
              } @else {
                {{ headingText() }}
              }
            </div>
          </div>
        }

        <div class="vdocs:p-6 vdocs:text-sm vdocs:text-ink">
          <ng-content />
        </div>

        @if (footer(); as tpl) {
          <div class="vdocs:px-6 vdocs:pb-6">
            <ng-container [ngTemplateOutlet]="tpl" />
          </div>
        }
      </div>
    </div>
  `,
})
export class VerdocsDialogComponent {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);

  /** Rendered in the header row. Plain strings get the title treatment; a TemplateRef supplies rich content. */
  readonly heading = input<string | TemplateRef<void> | null>(null);
  /** Rendered below the body, typically an action button row. */
  readonly footer = input<TemplateRef<void> | null>(null);
  /** If true, clicking the background overlay will not close the dialog. */
  readonly persistent = input(false);

  /** Emitted when the user dismisses via the overlay or the close button. React's onClose. */
  readonly closed = output<void>();

  protected readonly headingTemplate = computed(() => {
    const heading = this.heading();
    return heading instanceof TemplateRef ? heading : null;
  });

  protected readonly headingText = computed(() => {
    const heading = this.heading();
    return typeof heading === 'string' ? heading : '';
  });

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
    });

    inject(DestroyRef).onDestroy(() => this.movedEl?.remove());
  }

  protected onOverlayClick(event: MouseEvent) {
    // Only a direct overlay click dismisses; clicks inside the panel land on
    // descendants and stay put.
    if (!this.persistent() && event.target === event.currentTarget) {
      event.preventDefault();
      this.closed.emit();
    }
  }
}
