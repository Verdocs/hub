import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * A standard date input field, styled to match the other controls. The value
 * is always an ISO yyyy-mm-dd string and is a two-way model: bind with
 * [(value)]. React's value/onChange pair is this component's value model plus
 * its valueChange event.
 */
@Component({
  selector: 'verdocs-date-input',
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

      <!-- The legacy Stencil control embedded the air-datepicker widget. The native SDKs lean
           on the platform date picker (input type="date") instead: no dependency, and a stable
           value format. -->
      <input
        type="date"
        [value]="value()"
        [required]="required()"
        [disabled]="disabled()"
        data-lpignore="true"
        class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
        (input)="onInput($event)" />

      @if (description()) {
        <div class="vdocs:text-xs vdocs:text-muted vdocs:mt-1">{{ description() }}</div>
      }
    </label>
  `,
})
export class VerdocsDateInputComponent {
  /** The current value as an ISO yyyy-mm-dd string. Two-way bindable with [(value)]. */
  readonly value = model('');
  /** The label for the field. */
  readonly label = input('');
  /** Displayed below the field in a small font, typically instructions or reminders. */
  readonly description = input('');
  readonly required = input(false);
  readonly disabled = input(false);

  protected onInput(event: Event) {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
