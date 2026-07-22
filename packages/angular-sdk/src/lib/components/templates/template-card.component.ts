import type { ITemplate } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Display a summary card for a template: its name, the organization it lives
 * in, and its star, page, and usage counts. React's onClick callback is this
 * component's selectTemplate output; the whole card is the click target.
 */
@Component({
  selector: 'verdocs-template-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'vdocs:flex vdocs:flex-col vdocs:w-[320px] vdocs:h-[320px] vdocs:p-[25px] vdocs:box-border vdocs:bg-surface vdocs:font-sans ' +
      'vdocs:text-ink vdocs:shadow-[2px_2px_5px_rgba(51,54,75,0.05)] vdocs:cursor-pointer',
    '(click)': 'selectTemplate.emit(template())',
  },
  template: `
    <span class="vdocs:text-lg vdocs:font-bold vdocs:mb-[7px]">{{ template().name }}</span>

    <span class="vdocs:text-sm vdocs:font-bold vdocs:mb-1.5">{{ template().organization?.name || 'Public' }}</span>

    <hr class="vdocs:w-full vdocs:h-px vdocs:mb-[17px] vdocs:bg-edge vdocs:border-none" />

    <div class="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:text-base">
      <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
          <title>Stars</title>
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        <span>{{ template().star_counter }}</span>
      </div>

      <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
          <title>Pages</title>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="m9 15 2 2 4-4" />
        </svg>
        <span>{{ template().documents?.[0]?.pages || 1 }}</span>
      </div>

      <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
          <title>Usage Counter</title>
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <span>{{ template().counter }}</span>
      </div>
    </div>
  `,
})
export class VerdocsTemplateCardComponent {
  /** The template to summarize. */
  readonly template = input.required<ITemplate>();

  /** Emitted when the user clicks the card, with the template. */
  readonly selectTemplate = output<ITemplate>();
}
