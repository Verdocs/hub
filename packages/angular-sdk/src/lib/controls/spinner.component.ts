import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Display a small loading spinner.
 */
@Component({
  selector: 'verdocs-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-label': 'Loading',
    '[class]': 'hostClasses()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.flex]': `'0 0 ' + size() + 'px'`,
    '[style.display]': `'block'`,
  },
  template: '',
})
export class VerdocsSpinnerComponent {
  /** Diameter of the spinner in pixels. */
  readonly size = input(32);
  /** Light spinners suit dark backgrounds, dark spinners suit light ones. */
  readonly mode = input<'light' | 'dark'>('light');

  protected readonly hostClasses = computed(
    () =>
      `vdocs:animate-spin vdocs:rounded-full vdocs:border-[3px] ${
        this.mode() === 'light' ? 'vdocs:border-white/30 vdocs:border-t-white' : 'vdocs:border-ink/30 vdocs:border-t-ink'
      }`,
  );
}
