import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

const THEME_CLASSES = {
  primary: 'vdocs:checked:bg-primary',
  secondary: 'vdocs:checked:bg-accent-dark',
};

/**
 * A toggle switch for boolean settings. Wraps a native checkbox input exposed with
 * the switch role, so it participates in forms and assistive tech like any input.
 * The checked state is a two-way model: bind with [(checked)]. React's
 * onCheckedChange callback is this component's checkedChange event.
 */
@Component({
  selector: 'verdocs-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'inline-block'` },
  template: `
    <label class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-not-allowed">
      <!-- The input is the track. The thumb has to be a following sibling, not a
           child, for peer-checked to move it. -->
      <span class="vdocs:relative vdocs:inline-flex vdocs:h-6 vdocs:w-11 vdocs:shrink-0">
        <input
          type="checkbox"
          role="switch"
          [checked]="checked()"
          [disabled]="disabled()"
          [attr.name]="name() || null"
          [attr.aria-label]="label() ? null : ariaLabel() || null"
          [class]="trackClasses()"
          (change)="onChange($event)" />
        <span
          class="vdocs:pointer-events-none vdocs:absolute vdocs:top-0.5 vdocs:left-0.5 vdocs:size-5 vdocs:rounded-full vdocs:bg-white vdocs:shadow-lg vdocs:transition-transform vdocs:duration-150 vdocs:peer-checked:translate-x-5"></span>
      </span>
      @if (label()) {
        <span class="vdocs:text-sm">{{ label() }}</span>
      }
    </label>
  `,
})
export class VerdocsSwitchComponent {
  /** Whether the switch is on. Two-way bindable with [(checked)]. */
  readonly checked = model(false);
  /** Label displayed to the right of the switch. Without one, supply ariaLabel instead. */
  readonly label = input('');
  /** Accessible name for the switch when no visible label is given. */
  readonly ariaLabel = input('');
  /** Select the green (primary) or blue (secondary) treatment. */
  readonly theme = input<'primary' | 'secondary'>('primary');
  /** Form field name applied to the native input. */
  readonly name = input('');
  readonly disabled = input(false);

  protected readonly trackClasses = computed(
    () =>
      'vdocs:peer vdocs:appearance-none vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:size-full vdocs:cursor-pointer vdocs:rounded-full vdocs:bg-edge-light vdocs:transition-colors vdocs:duration-150 vdocs:disabled:cursor-not-allowed vdocs:disabled:bg-disabled ' +
      THEME_CLASSES[this.theme()],
  );

  protected onChange(event: Event) {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
