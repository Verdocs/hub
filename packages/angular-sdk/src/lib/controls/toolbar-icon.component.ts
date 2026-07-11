import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

const TOOLTIP_PLACEMENT_CLASSES = {
  top: 'vdocs:bottom-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mb-1.5',
  bottom: 'vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1.5',
  // The wider gap on the left matches the legacy offset used by the floating page menu.
  left: 'vdocs:right-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:mr-5',
  right: 'vdocs:left-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:ml-1.5',
};

const ARROW_PLACEMENT_CLASSES = {
  top: 'vdocs:bottom-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  bottom: 'vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  left: 'vdocs:right-[-4px] vdocs:top-1/2 vdocs:-mt-1',
  right: 'vdocs:left-[-4px] vdocs:top-1/2 vdocs:-mt-1',
};

// aria-describedby needs a page-unique id per instance; Angular has no useId
// equivalent, so a module counter does the job.
let nextTooltipId = 0;

/**
 * Displays a clickable toolbar icon. Upon hover or focus, a tooltip will be
 * displayed with the supplied text. Project the icon as content and listen for
 * plain (click) events on the host element:
 *
 * ```html
 * <verdocs-toolbar-icon text="Preview" (click)="preview()"><svg>...</svg></verdocs-toolbar-icon>
 * ```
 */
@Component({
  selector: 'verdocs-toolbar-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'inline-block'` },
  template: `
    <span class="vdocs:font-sans vdocs:relative vdocs:inline-flex vdocs:items-center vdocs:justify-center">
      <button
        [type]="type()"
        [disabled]="disabled()"
        [attr.aria-label]="text() || null"
        [attr.aria-describedby]="tooltipId"
        class="vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-muted"
        (mouseenter)="showing.set(true)"
        (mouseleave)="showing.set(false)"
        (focus)="showing.set(true)"
        (blur)="showing.set(false)">
        <ng-content />
      </button>

      @if (showing() && text()) {
        <span [id]="tooltipId" role="tooltip" [class]="tooltipClasses()">
          {{ text() }}
          <span [class]="arrowClasses()"></span>
        </span>
      }
    </span>
  `,
})
export class VerdocsToolbarIconComponent {
  /** Tooltip text to display on hover/focus. */
  readonly text = input('');
  /** Which side of the icon the tooltip appears on. */
  readonly placement = input<'top' | 'bottom' | 'left' | 'right'>('bottom');
  /** The native button type. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);

  protected readonly showing = signal(false);
  protected readonly tooltipId = `verdocs-toolbar-tooltip-${nextTooltipId++}`;

  protected readonly tooltipClasses = computed(
    () =>
      'vdocs:absolute vdocs:z-[20000] vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-[13px] vdocs:font-bold vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999] ' +
      TOOLTIP_PLACEMENT_CLASSES[this.placement()],
  );

  protected readonly arrowClasses = computed(
    () => `vdocs:absolute vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface ${ARROW_PLACEMENT_CLASSES[this.placement()]}`,
  );
}
