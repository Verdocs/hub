import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, model, TemplateRef } from '@angular/core';

export interface IToggleButton {
  /** Identifier for the button. */
  id: string;
  /** Accessible name for the button. */
  label: string;
  /** Template for the button face. Icons render at 30px and inherit the current text color. */
  icon: TemplateRef<unknown>;
}

/**
 * A group of icon buttons where exactly one is selected at a time, with an
 * optional heading label. The selection is a two-way model holding the selected
 * index: bind with [(selection)]. React's defaultSelection/selection/onChange
 * trio collapses into this model; selectionChange emits the new index, and the
 * button itself is buttons[index]. Icons are TemplateRefs, the Angular take on
 * React's ReactNode icons:
 *
 * ```html
 * <ng-template #boldIcon><svg>...</svg></ng-template>
 * <verdocs-toggle [buttons]="[{ id: 'bold', label: 'Bold', icon: boldIcon }]" />
 * ```
 */
@Component({
  selector: 'verdocs-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ NgTemplateOutlet ],
  host: { '[style.display]': `'block'` },
  template: `
    <div role="group" [attr.aria-label]="label() || null" class="vdocs:flex vdocs:items-center vdocs:bg-canvas vdocs:font-sans">
      @if (label()) {
        <span class="vdocs:text-2xl vdocs:font-bold vdocs:text-ink vdocs:mr-7">{{ label() }}:</span>
      }
      <div class="vdocs:flex vdocs:gap-[11px]">
        @for (button of buttons(); track button.id) {
          <button
            type="button"
            [attr.aria-label]="button.label"
            [attr.aria-pressed]="$index === selection()"
            [class]="buttonClasses($index === selection())"
            (click)="selection.set($index)">
            <ng-container [ngTemplateOutlet]="button.icon" />
          </button>
        }
      </div>
    </div>
  `,
})
export class VerdocsToggleComponent {
  /** The buttons to display. */
  readonly buttons = input.required<IToggleButton[]>();
  /** Optional heading label displayed before the buttons. Also names the group for assistive tech. */
  readonly label = input('');
  /** Index of the selected button. Two-way bindable with [(selection)]. */
  readonly selection = model(0);

  protected buttonClasses(selected: boolean) {
    return (
      'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-[60px] vdocs:p-0 vdocs:border-2 vdocs:border-solid vdocs:border-accent vdocs:rounded-row vdocs:cursor-pointer vdocs:transition-colors vdocs:duration-200 vdocs:[&_svg]:size-[30px] vdocs:hover:bg-accent vdocs:hover:text-canvas ' +
      (selected ? 'vdocs:bg-accent-light vdocs:text-white' : 'vdocs:bg-surface vdocs:text-ink')
    );
  }
}
