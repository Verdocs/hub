import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const VARIANT_CLASSES = {
  // The 14px clip-path values keep the arrow a constant size regardless of the flag's width.
  fill: 'vdocs:w-[110px] vdocs:pl-3.5 vdocs:[clip-path:polygon(0px_50%,14px_0,100%_0,100%_100%,14px_100%)]',
  // No arrow: the width and margin shrink by the 14px the arrow would have occupied.
  next: 'vdocs:w-24 vdocs:ml-3.5',
};

/**
 * Display a flag prompting the signer to act on a field, e.g. FILL or NEXT.
 * The flag positions itself to the right of its nearest positioned ancestor.
 * Clicks on the flag body surface through plain (click) events on the host
 * element; React's onSkip callback is this component's skip output.
 */
@Component({
  selector: 'verdocs-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
  template: `
    <div class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-full vdocs:gap-1">
      {{ label() }}
      @if (showSkip()) {
        <span>
          {{ 'or ' }}
          <button
            type="button"
            class="vdocs:font-sans vdocs:text-white vdocs:text-xs vdocs:leading-none vdocs:font-normal vdocs:underline vdocs:hover:no-underline vdocs:cursor-pointer vdocs:bg-transparent vdocs:border-none vdocs:p-0"
            (click)="onSkip($event)">
            SKIP
          </button>
        </span>
      }
    </div>
  `,
})
export class VerdocsFlagComponent {
  /** The type of flag to display. */
  readonly variant = input<'fill' | 'next'>('fill');
  /** The text label to display in the flag. */
  readonly label = input('FILL');
  /** If true, shows an "or SKIP" link. */
  readonly showSkip = input(false);

  /** Emitted when the SKIP link is clicked. */
  readonly skip = output<void>();

  // The flag is positioned and styled on the host element itself so the empty
  // host never occupies space in the field layout it decorates.
  protected readonly hostClasses = computed(
    () =>
      'vdocs:absolute vdocs:left-full vdocs:h-6 vdocs:flex vdocs:bg-[#13a10e] vdocs:font-sans vdocs:text-white vdocs:font-semibold vdocs:text-xs vdocs:leading-none vdocs:hover:drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)] vdocs:hover:-translate-x-px ' +
      VARIANT_CLASSES[this.variant()],
  );

  protected onSkip(event: MouseEvent) {
    // The flag body typically has its own click handler (focus the field), so
    // a skip click must not bubble into it.
    event.stopPropagation();
    this.skip.emit();
  }
}
