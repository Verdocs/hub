import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const SIZE_CLASSES = {
  xsmall: 'vdocs:h-6 vdocs:text-xs',
  small: 'vdocs:h-8 vdocs:text-[13px]',
  normal: 'vdocs:h-10 vdocs:text-sm',
  medium: 'vdocs:h-[46px] vdocs:text-[15px]',
  large: 'vdocs:h-[52px] vdocs:text-base',
};

// outline is the secondary/cancel role: a soft accent fill rather than a literal outline.
const VARIANT_CLASSES = {
  standard:
    'vdocs:bg-primary vdocs:text-white vdocs:border-none vdocs:rounded-ctl vdocs:shadow-xs vdocs:hover:bg-primary-dark vdocs:disabled:bg-disabled-fill vdocs:disabled:text-disabled vdocs:disabled:shadow-none',
  outline:
    'vdocs:bg-accent-tint vdocs:text-accent vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-accent-tint-dark vdocs:disabled:bg-disabled-fill vdocs:disabled:text-disabled',
  text: 'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled',
};

/**
 * A simple button, with consistent styling to other controls in the design
 * system. Listen for plain (click) events on the host element.
 */
@Component({
  selector: 'verdocs-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': `'inline-block'`,
    '[style.pointerEvents]': `disabled() ? 'none' : 'auto'`,
  },
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="buttonClasses()">
      <span class="vdocs:px-3.5">{{ label() }}</span>
    </button>
  `,
})
export class VerdocsButtonComponent {
  /** The label for the button. */
  readonly label = input.required<string>();
  /** The size (height) of the button. */
  readonly size = input<'xsmall' | 'small' | 'normal' | 'medium' | 'large'>('normal');
  /** The display variant of the button. */
  readonly variant = input<'standard' | 'text' | 'outline'>('standard');
  /** The native button type. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** Whether the button should be disabled. */
  readonly disabled = input(false);

  protected readonly buttonClasses = computed(
    () =>
      'vdocs:font-sans vdocs:font-medium vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:w-full ' +
      `${SIZE_CLASSES[this.size()]} ${VARIANT_CLASSES[this.variant()]}`,
  );
}
