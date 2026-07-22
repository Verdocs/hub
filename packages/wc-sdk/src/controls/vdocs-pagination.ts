import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { integerSequence } from '@verdocs/js-sdk';
import { chevronDoubleLeftIcon, chevronDoubleRightIcon } from './icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

const VISIBLE_PAGES = 5;

/**
 * Display a simple pagination control with individual buttons to move through
 * the data set.
 *
 * @fires vdocs-select-page - Fired when the user selects a page, with the 0-based page number in detail.
 */
export class VdocsPagination extends VdocsElement {
  static override properties = {
    selectedPage: { type: Number, attribute: 'selected-page' },
    itemCount: { type: Number, attribute: 'item-count' },
    perPage: { type: Number, attribute: 'per-page' },
  };

  /** The currently selected page (0-based). */
  declare selectedPage: number;
  /** The total number of items. */
  declare itemCount: number;
  /** The number of items displayed per page. */
  declare perPage: number;

  constructor() {
    super();
    this.selectedPage = 0;
    this.itemCount = 0;
    this.perPage = 10;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private selectPage(page: number) {
    this.emit('vdocs-select-page', { page });
  }

  private pageButton(label: string, selected: boolean, onClick: () => void, content: TemplateResult | string) {
    return html`
      <button
        type="button"
        aria-label=${label}
        aria-current=${selected ? 'page' : nothing}
        class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:text-sm vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:cursor-pointer ${selected ?
          'vdocs:bg-accent vdocs:text-white vdocs:border-accent' :
          'vdocs:bg-surface vdocs:text-ink vdocs:border-edge-light vdocs:hover:border-accent'}"
        @click=${onClick}>
        ${content}
      </button>`;
  }

  override render() {
    const numPages = this.itemCount > 0 ? Math.ceil(this.itemCount / this.perPage) : 0;
    const firstPage = Math.max(0, this.selectedPage - 2);
    const pagesToDisplay = integerSequence(0, numPages).slice(firstPage, firstPage + VISIBLE_PAGES);

    return html`
      <nav aria-label="Pagination" class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:font-sans">
        ${this.selectedPage > 0 ?
            this.pageButton('First page', false, () => this.selectPage(0), chevronDoubleLeftIcon({ className: 'vdocs:size-4' })) :
          ''}

        ${firstPage > 0 ? html`<div class="vdocs:text-muted vdocs:px-1">...</div>` : ''}

        ${pagesToDisplay.map(pageNumber =>
          this.pageButton(`Page ${pageNumber + 1}`, pageNumber === this.selectedPage, () => this.selectPage(pageNumber), `${pageNumber + 1}`))}

        ${this.selectedPage < numPages - 1 ? html`<div class="vdocs:text-muted vdocs:px-1">...</div>` : ''}

        ${this.selectedPage < numPages - 1 ?
            this.pageButton('Last page', false, () => this.selectPage(numPages - 1), chevronDoubleRightIcon({ className: 'vdocs:size-4' })) :
          ''}
      </nav>`;
  }
}

register('vdocs-pagination', VdocsPagination);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-pagination': VdocsPagination;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-select-page': CustomEvent<{ page: number }>;
  }
}
