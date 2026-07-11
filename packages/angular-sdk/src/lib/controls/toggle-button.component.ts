import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

const SIZE_CLASSES = {
  normal: 'vdocs:size-10 vdocs:p-1.5 vdocs:rounded-ctl',
  small: 'vdocs:size-[34px] vdocs:p-1 vdocs:rounded-[2px]',
};

/**
 * Display a single button that can be toggled on and off by clicking it. The
 * active state is a two-way model: bind with [(active)]. React's onToggle
 * callback is this component's activeChange event. Project icon content for
 * the button face; without it the label text is the face. The label always
 * doubles as the accessible name.
 *
 * ```html
 * <verdocs-toggle-button label="Messages" [(active)]="active"><svg>...</svg></verdocs-toggle-button>
 * ```
 */
@Component({
  selector: 'verdocs-toggle-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'inline-block'` },
  template: `
    <button type="button" [attr.aria-pressed]="active()" [attr.aria-label]="label() || null" [class]="buttonClasses()" (click)="onToggle($event)">
      <ng-content>{{ label() }}</ng-content>
    </button>
  `,
})
export class VerdocsToggleButtonComponent {
  /** Whether the button renders pressed. Two-way bindable with [(active)]. */
  readonly active = model(false);
  /** Accessible name for the button, and its face when no icon content is projected. */
  readonly label = input('');
  /** Small buttons suit dialogs and other compact regions. */
  readonly size = input<'small' | 'normal'>('normal');

  protected readonly buttonClasses = computed(
    () =>
      'vdocs:font-sans vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:cursor-pointer vdocs:[&_svg]:max-w-full vdocs:[&_svg]:max-h-full vdocs:[&_svg]:fill-current ' +
      `${SIZE_CLASSES[this.size()]} ${this.active() ? 'vdocs:bg-primary vdocs:text-canvas' : 'vdocs:bg-edge-light vdocs:text-ink'}`,
  );

  protected onToggle(event: MouseEvent) {
    // The legacy control stopped propagation so a toggle never doubles as a click on
    // whatever hosts the button (field toolbars). Keep that contract.
    event.stopPropagation();
    this.active.set(!this.active());
  }
}
