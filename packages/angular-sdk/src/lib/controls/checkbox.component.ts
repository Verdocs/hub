import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

const SIZE_CLASSES = {
  normal: { box: 'vdocs:size-5', check: 'vdocs:size-3.5' },
  small: { box: 'vdocs:size-4', check: 'vdocs:size-3' },
};

const THEME_CLASSES = {
  light: 'vdocs:border-edge',
  dark: 'vdocs:border-white',
};

/**
 * A simple check box for UI displays, e.g. dialog boxes. This is distinct from the
 * field checkbox used in signing experiences. The checked state is a two-way model:
 * bind with [(checked)]. React's checked/onChange pair is this component's checked
 * model plus its checkedChange event.
 */
@Component({
  selector: 'verdocs-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'inline-block'` },
  template: `
    <label
      class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50">
      <!-- The input is the visible box (appearance-none). The check mark has to be a
           following sibling, not a child, for peer-checked to reveal it. -->
      <span class="vdocs:relative vdocs:inline-flex vdocs:shrink-0">
        <input
          type="checkbox"
          [checked]="checked()"
          [disabled]="disabled()"
          [attr.name]="name() || null"
          [class]="boxClasses()"
          (change)="onChange($event)" />
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" [class]="checkClasses()">
          <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      @if (label()) {
        <span class="vdocs:text-sm">{{ label() }}</span>
      }
    </label>
  `,
})
export class VerdocsCheckboxComponent {
  /** Whether the box is checked. Two-way bindable with [(checked)]. */
  readonly checked = model(false);
  /** Label displayed to the right of the box. Leave blank for no label. */
  readonly label = input('');
  /** Use 'dark' when rendering on a dark background (lightens the unchecked border). */
  readonly theme = input<'light' | 'dark'>('light');
  /** The size of the box. */
  readonly size = input<'normal' | 'small'>('normal');
  /** Form field name applied to the native input. */
  readonly name = input('');
  readonly disabled = input(false);

  protected readonly boxClasses = computed(
    () =>
      'vdocs:peer vdocs:appearance-none vdocs:m-0 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-[2px] vdocs:border-2 vdocs:border-solid vdocs:bg-transparent vdocs:checked:bg-primary vdocs:checked:border-primary vdocs:disabled:cursor-default ' +
      `${SIZE_CLASSES[this.size()].box} ${THEME_CLASSES[this.theme()]}`,
  );

  protected readonly checkClasses = computed(
    () =>
      `vdocs:pointer-events-none vdocs:absolute vdocs:inset-0 vdocs:m-auto vdocs:hidden vdocs:peer-checked:block vdocs:text-white ${SIZE_CLASSES[this.size()].check}`,
  );

  protected onChange(event: Event) {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
