import { IOrganization } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Display a small summary card describing an organization: its logo (with a
 * placeholder icon fallback), name, and web site link if one is set.
 */
@Component({
  selector: 'verdocs-organization-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <div
      class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3.5 vdocs:px-[15px] vdocs:py-[7px] vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-lg vdocs:font-sans vdocs:text-ink">
      @if (organization().thumbnail_url) {
        <img [src]="organization().thumbnail_url" alt="Logo" class="vdocs:size-6 vdocs:shrink-0" />
      } @else {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="vdocs:size-6 vdocs:shrink-0 vdocs:text-edge"
          aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      }

      <div class="vdocs:flex vdocs:flex-col vdocs:overflow-hidden">
        <div class="vdocs:text-base vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">{{ organization().name }}</div>

        @if (organization().url) {
          <a
            [href]="organization().url"
            target="_blank"
            rel="noreferrer nofollow"
            class="vdocs:text-sm vdocs:text-accent vdocs:no-underline vdocs:hover:underline vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">
            {{ organization().url }}
          </a>
        }
      </div>
    </div>
  `,
})
export class VerdocsOrganizationCardComponent {
  /** The organization to display. */
  readonly organization = input.required<IOrganization>();
}
