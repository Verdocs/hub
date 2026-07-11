import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Render a simple error message. Other components render this when they cannot
 * proceed, e.g. after a failed data load.
 */
@Component({
  selector: 'verdocs-component-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <div role="alert" class="vdocs:font-sans vdocs:flex vdocs:p-[15px] vdocs:items-center vdocs:justify-center">
      <div
        class="vdocs:flex-1 vdocs:h-[300px] vdocs:flex vdocs:text-lg vdocs:text-ink vdocs:box-border vdocs:px-5 vdocs:bg-surface vdocs:items-center vdocs:justify-center">
        {{ message() }}
      </div>
    </div>
  `,
})
export class VerdocsComponentErrorComponent {
  /** The message to display. */
  readonly message = input.required<string>();
}
