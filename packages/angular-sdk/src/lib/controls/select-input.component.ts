import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface ISelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value reported when the option is selected. */
  value: string;
}

/**
 * A standard select field with minimal markup, styled to match the other
 * controls. The value is a two-way model: bind with [(value)]. React's
 * value/onChange pair is this component's value model plus its valueChange
 * event.
 */
@Component({
  selector: 'verdocs-select-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <label class="vdocs:block vdocs:font-sans vdocs:mb-2.5">
      @if (label()) {
        <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          {{ label() }}:
          @if (required()) {
            <span class="vdocs:text-danger">*</span>
          }
        </div>
      }

      <select
        [required]="required()"
        [disabled]="disabled()"
        class="vdocs:w-full vdocs:h-10 vdocs:px-2 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:cursor-pointer vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted vdocs:disabled:cursor-default"
        (change)="onChange($event)">
        @for (option of options(); track option.value) {
          <!-- Selection is bound per option: binding value on the select can race
               the option elements rendering, leaving nothing selected. -->
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>

      @if (description()) {
        <div class="vdocs:text-xs vdocs:text-muted vdocs:mt-1">{{ description() }}</div>
      }
    </label>
  `,
})
export class VerdocsSelectInputComponent {
  /** The options to list. */
  readonly options = input.required<ISelectOption[]>();
  /** The current value. Two-way bindable with [(value)]. */
  readonly value = model('');
  /** The label for the field. */
  readonly label = input('');
  /** Displayed below the field in a small font, typically instructions or reminders. */
  readonly description = input('');
  readonly required = input(false);
  readonly disabled = input(false);

  protected onChange(event: Event) {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
