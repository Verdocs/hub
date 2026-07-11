import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { VerdocsPortalComponent } from './portal.component';

/**
 * Display an icon button that opens a floating panel of arbitrary content, such
 * as settings forms or metadata. The panel is anchored to the button and closes
 * when the user clicks anywhere outside it. Mark the trigger icon with the icon
 * attribute; everything else projects into the panel:
 *
 * ```html
 * <verdocs-button-panel label="Field settings">
 *   <svg icon>...</svg>
 *   <div>Field Settings</div>
 * </verdocs-button-panel>
 * ```
 */
@Component({
  selector: 'verdocs-button-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsPortalComponent ],
  host: { class: 'vdocs:inline-block vdocs:font-sans' },
  template: `
    <button
      #trigger
      type="button"
      aria-haspopup="dialog"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="label()"
      class="vdocs:inline-flex vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:opacity-60 vdocs:text-accent-light vdocs:hover:opacity-100 vdocs:[&_svg]:fill-current"
      (click)="open.set(!open())">
      <ng-content select="[icon]" />
    </button>

    @if (open()) {
      <verdocs-portal [anchor]="trigger" (clickAway)="open.set(false)">
        <div
          role="dialog"
          [attr.aria-label]="label()"
          class="vdocs:w-80 vdocs:p-[15px] vdocs:text-sm vdocs:font-bold vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:rounded-ctl vdocs:shadow-lg">
          <ng-content />
        </div>
      </verdocs-portal>
    }
  `,
})
export class VerdocsButtonPanelComponent {
  /** Accessible name for the trigger button and its panel. */
  readonly label = input('Open panel');

  protected readonly open = signal(false);
}
