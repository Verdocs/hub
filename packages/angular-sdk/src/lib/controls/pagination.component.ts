import { integerSequence } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const VISIBLE_PAGES = 5;

/**
 * Display a simple pagination control with individual buttons to move through
 * the data set. Pages are 0-based.
 */
@Component({
  selector: 'verdocs-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <nav aria-label="Pagination" class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:font-sans">
      @if (selectedPage() > 0) {
        <button type="button" aria-label="First page" [class]="buttonClasses(false)" (click)="selectPage.emit(0)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-4" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>
      }

      @if (firstPage() > 0) {
        <div class="vdocs:text-muted vdocs:px-1">...</div>
      }

      @for (pageNumber of pagesToDisplay(); track pageNumber) {
        <button
          type="button"
          [attr.aria-label]="'Page ' + (pageNumber + 1)"
          [attr.aria-current]="pageNumber === selectedPage() ? 'page' : null"
          [class]="buttonClasses(pageNumber === selectedPage())"
          (click)="selectPage.emit(pageNumber)">
          {{ pageNumber + 1 }}
        </button>
      }

      @if (selectedPage() < numPages() - 1) {
        <div class="vdocs:text-muted vdocs:px-1">...</div>
        <button type="button" aria-label="Last page" [class]="buttonClasses(false)" (click)="selectPage.emit(numPages() - 1)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-4" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      }
    </nav>
  `,
})
export class VerdocsPaginationComponent {
  /** The currently selected page (0-based). */
  readonly selectedPage = input(0);
  /** The total number of items. */
  readonly itemCount = input(0);
  /** The number of items displayed per page. */
  readonly perPage = input(10);

  /** Emitted when the user selects a page. */
  readonly selectPage = output<number>();

  protected readonly numPages = computed(() => (this.itemCount() > 0 ? Math.ceil(this.itemCount() / this.perPage()) : 0));
  protected readonly firstPage = computed(() => Math.max(0, this.selectedPage() - 2));
  protected readonly pagesToDisplay = computed(() =>
    integerSequence(0, this.numPages()).slice(this.firstPage(), this.firstPage() + VISIBLE_PAGES));

  protected buttonClasses(selected: boolean) {
    const base = 'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:text-sm vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:cursor-pointer ';
    return base + (selected ?
      'vdocs:bg-accent vdocs:text-white vdocs:border-accent' :
      'vdocs:bg-surface vdocs:text-ink vdocs:border-edge-light vdocs:hover:border-accent');
  }
}
