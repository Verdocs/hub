import type { FC, ReactNode } from 'react';
import { integerSequence } from '@verdocs/js-sdk';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './icons';

export interface PaginationProps {
  /** The currently selected page (0-based). */
  selectedPage?: number;
  /** The total number of items. */
  itemCount?: number;
  /** The number of items displayed per page. */
  perPage?: number;
  /** Called when the user selects a page. */
  onSelectPage?: (page: number) => void;
}

const VISIBLE_PAGES = 5;

const PageButton: FC<{ selected?: boolean; onClick: () => void; children: ReactNode; label: string }> = ({ selected, onClick, children, label }) => (
  <button
    type="button"
    aria-label={label}
    aria-current={selected ? 'page' : undefined}
    onClick={onClick}
    className={`vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:text-sm vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:cursor-pointer ${
      selected
        ? 'vdocs:bg-accent vdocs:text-white vdocs:border-accent'
        : 'vdocs:bg-surface vdocs:text-ink vdocs:border-edge-light vdocs:hover:border-accent'
    }`}>
    {children}
  </button>
);

/**
 * Display a simple pagination control with individual buttons to move through
 * the data set.
 */
export const Pagination: FC<PaginationProps> = ({ selectedPage = 0, itemCount = 0, perPage = 10, onSelectPage }) => {
  const numPages = itemCount > 0 ? Math.ceil(itemCount / perPage) : 0;
  const firstPage = Math.max(0, selectedPage - 2);
  const pagesToDisplay = integerSequence(0, numPages).slice(firstPage, firstPage + VISIBLE_PAGES);

  return (
    <nav aria-label="Pagination" className="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:font-sans">
      {selectedPage > 0 && (
        <PageButton label="First page" onClick={() => onSelectPage?.(0)}>
          <ChevronDoubleLeftIcon className="vdocs:size-4" />
        </PageButton>
      )}

      {firstPage > 0 && (
        <div className="vdocs:text-muted vdocs:px-1">
          ...
        </div>
      )}

      {pagesToDisplay.map(pageNumber => (
        <PageButton
          key={pageNumber}
          label={`Page ${pageNumber + 1}`}
          selected={pageNumber === selectedPage}
          onClick={() => onSelectPage?.(pageNumber)}>
          {pageNumber + 1}
        </PageButton>
      ))}

      {selectedPage < numPages - 1 && (
        <div className="vdocs:text-muted vdocs:px-1">
          ...
        </div>
      )}

      {selectedPage < numPages - 1 && (
        <PageButton label="Last page" onClick={() => onSelectPage?.(numPages - 1)}>
          <ChevronDoubleRightIcon className="vdocs:size-4" />
        </PageButton>
      )}
    </nav>
  );
};
