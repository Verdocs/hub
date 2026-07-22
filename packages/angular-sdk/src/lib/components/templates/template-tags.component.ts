import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Display a template's tags as a row of small chips. Display-only: tags are
 * assigned to templates via the API.
 */
@Component({
  selector: 'verdocs-template-tags',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'vdocs:block vdocs:font-sans' },
  template: `
    @for (tag of tags(); track tag) {
      <span
        class="vdocs:inline-block vdocs:box-border vdocs:h-7 vdocs:mx-1 vdocs:px-3 vdocs:pt-[5px] vdocs:pb-[7px] vdocs:text-xs vdocs:font-semibold vdocs:uppercase vdocs:rounded-row vdocs:text-ink vdocs:bg-canvas vdocs:border vdocs:border-solid vdocs:border-accent-light">
        {{ tag }}
      </span>
    }
  `,
})
export class VerdocsTemplateTagsComponent {
  /** The tags to display. */
  readonly tags = input<string[]>([]);
}
