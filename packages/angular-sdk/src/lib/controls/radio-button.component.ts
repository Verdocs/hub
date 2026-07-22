import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/**
 * A simple radio button for UI displays, e.g. dialog boxes. This is distinct from
 * the field radio button used in signing experiences. Buttons sharing the same
 * name form a group. React's checked/onChange pair is this component's checked
 * model plus its checkedChange event. The browser never fires a change event on
 * the button a group selection moves away from, so grouped buttons should derive
 * [checked] from parent state rather than rely on two-way binding.
 */
@Component({
  selector: 'verdocs-radio-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'inline-block'` },
  template: `
    <label
      class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50">
      <input
        type="radio"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.name]="name() || null"
        [attr.value]="value() || null"
        class="vdocs:appearance-none vdocs:m-0 vdocs:size-4 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-ink/60 vdocs:bg-canvas vdocs:transition vdocs:duration-200 vdocs:outline-none vdocs:checked:bg-primary vdocs:checked:ring-2 vdocs:checked:ring-inset vdocs:checked:ring-canvas vdocs:focus-visible:border-primary vdocs:disabled:cursor-default vdocs:disabled:bg-canvas vdocs:disabled:border-canvas"
        (change)="onChange($event)" />
      @if (label()) {
        <span class="vdocs:text-sm">{{ label() }}</span>
      }
    </label>
  `,
})
export class VerdocsRadioButtonComponent {
  /** Whether the button is checked. Two-way bindable with [(checked)]. */
  readonly checked = model(false);
  /** Label displayed to the right of the button. Leave blank for no label. */
  readonly label = input('');
  /** Form group name applied to the native input. Buttons sharing a name form a group. */
  readonly name = input('');
  /** Form value applied to the native input. */
  readonly value = input('');
  readonly disabled = input(false);

  protected onChange(event: Event) {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
