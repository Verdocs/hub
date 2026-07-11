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
  viewChild,
} from '@angular/core';

/**
 * Display a side panel that slides in from the edge of the screen, rendered into
 * document.body with an optional overlay dimming the rest of the page. Mount it
 * conditionally to show it: the parent removes the panel (typically from the
 * close event, React's onClose) to dismiss it.
 *
 * ```html
 * @if (open()) {
 *   <verdocs-menu-panel (close)="open.set(false)">
 *     <div>Panel content</div>
 *   </verdocs-menu-panel>
 * }
 * ```
 */
@Component({
  selector: 'verdocs-menu-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // The host is just a marker left at the declaration site; the wrapper div
    // moves to document.body. Hiding the host keeps the pre-move render from
    // shifting layout.
    '[style.display]': `'none'`,
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div #content>
      @if (overlay()) {
        <div aria-hidden="true" class="vdocs-menu-panel-overlay vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:bg-[#0000007f]"></div>
      }
      <div #panel role="dialog" [attr.aria-modal]="overlay()" [style.width.px]="width()" [class]="panelClasses()">
        <ng-content />
      </div>
    </div>
  `,
})
export class VerdocsMenuPanelComponent {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);

  /** Which side of the screen the panel slides in from. */
  readonly side = input<'left' | 'right'>('right');
  /** Whether to dim the rest of the page behind the panel. */
  readonly overlay = input(true);
  /** The width of the panel in pixels. */
  readonly width = input(300);

  /** Emitted when the user clicks outside the panel. */
  readonly close = output<void>();

  private readonly content = viewChild<ElementRef<HTMLDivElement>>('content');
  private readonly panel = viewChild<ElementRef<HTMLDivElement>>('panel');

  protected readonly panelClasses = computed(
    () =>
      'vdocs-menu-panel vdocs:fixed vdocs:top-0 vdocs:bottom-0 vdocs:z-[10001] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:transition vdocs:duration-[350ms] vdocs:translate-x-0 vdocs:opacity-100 vdocs:starting:opacity-0 ' +
      (this.side() === 'right' ? 'vdocs:right-0 vdocs:starting:translate-x-full' : 'vdocs:left-0 vdocs:starting:-translate-x-full'),
  );

  // View teardown only detaches nodes from where Angular thinks they are, which
  // is no longer true once we move the div, so we track it and remove it ourselves.
  private movedEl: HTMLDivElement | null = null;

  constructor() {
    // The panel moves to document.body so it escapes any overflow or stacking
    // context set by its parents.
    afterNextRender(() => {
      const contentEl = this.content()?.nativeElement;
      if (contentEl) {
        this.movedEl = contentEl;
        this.renderer.appendChild(this.document.body, contentEl);
      }
    });

    inject(DestroyRef).onDestroy(() => this.movedEl?.remove());
  }

  protected onDocumentClick(event: MouseEvent) {
    // Overlay clicks count as outside: only the panel itself is "inside".
    const panelEl = this.panel()?.nativeElement;
    if (panelEl && !panelEl.contains(event.target as Node)) {
      this.close.emit();
    }
  }
}
