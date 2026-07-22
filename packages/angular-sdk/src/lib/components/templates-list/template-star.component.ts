import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { createStarToggle, VerdocsTemplatesService } from '../../templates';
import { SDKError } from '../../types';

/**
 * A clickable star that lets users mark frequently-used templates. Toggling
 * reloads active template list queries on completion. Internal to
 * VerdocsTemplatesListComponent.
 */
@Component({
  selector: 'verdocs-template-star',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <div class="vdocs:flex vdocs:items-center vdocs:gap-1.5">
      <button
        type="button"
        [attr.aria-label]="template().star_counter ? 'Unstar template' : 'Star template'"
        [attr.aria-pressed]="!!template().star_counter"
        [disabled]="starToggle.isPending()"
        [class]="'vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-primary' + (starToggle.isPending() ? ' vdocs:opacity-40' : '')"
        (click)="toggle($event)">
        @if (template().star_counter) {
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="vdocs:size-6" aria-hidden="true">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        }
      </button>
      <div class="vdocs:text-sm vdocs:text-muted vdocs:min-w-5">{{ template().star_counter || '--' }}</div>
    </div>
  `,
})
export class VerdocsTemplateStarComponent {
  readonly template = input.required<ITemplate>();
  readonly endpoint = input<VerdocsEndpoint>();

  readonly sdkError = output<SDKError>();

  protected readonly starToggle = createStarToggle(inject(VerdocsTemplatesService), this.endpoint);

  protected toggle(event: MouseEvent) {
    event.stopPropagation();
    this.starToggle.toggle(this.template().id).catch((error: { message: string }) => this.sdkError.emit(new SDKError(error.message)));
  }
}
