import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Display a simple progress bar in a style consistent with the design system.
 */
@Component({
  selector: 'verdocs-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <div class="vdocs:font-sans vdocs:w-full vdocs:box-border vdocs:flex vdocs:flex-col">
      @if (label() || showPercent()) {
        <div class="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:mb-2">
          @if (label()) {
            <div class="vdocs:text-sm vdocs:font-semibold vdocs:text-ink">{{ label() }}</div>
          }
          @if (showPercent()) {
            <div class="vdocs:text-sm vdocs:font-semibold vdocs:text-ink">{{ percent() }}%</div>
          }
        </div>
      }

      <div
        role="progressbar"
        [attr.aria-label]="label() || 'Progress'"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-valuenow]="widthPercent()"
        class="vdocs:flex vdocs:h-2.5 vdocs:rounded-row vdocs:bg-edge-light">
        <div class="vdocs:rounded-row vdocs:bg-primary" [style.width.%]="widthPercent()"></div>
      </div>
    </div>
  `,
})
export class VerdocsProgressBarComponent {
  /** Optional label to display above the bar. */
  readonly label = input('');
  /** If true, the progress percentage will be displayed above the bar. */
  readonly showPercent = input(false);
  /** The current progress value (0-100). */
  readonly percent = input(0);

  protected readonly widthPercent = computed(() => Math.ceil(Math.min(Math.max(this.percent(), 0), 100)));
}
