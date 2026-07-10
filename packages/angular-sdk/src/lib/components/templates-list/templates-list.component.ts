import { canPerformTemplateAction } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import type { IGetTemplatesParams, IProfile, ITemplate, TSortTemplateBy, TTemplateVisibilityFilter, VerdocsEndpoint } from '@verdocs/js-sdk';
import { VerdocsQuickFilterComponent, type IFilterOption } from '../../controls/quick-filter.component';
import { VerdocsDropdownComponent, type IMenuOption } from '../../controls/dropdown.component';
import { VerdocsPaginationComponent } from '../../controls/pagination.component';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsSpinnerComponent } from '../../controls/spinner.component';
import { VerdocsTemplateStarComponent } from './template-star.component';
import { SDKError, type ITemplateEvent } from '../../types';
import { VerdocsTemplatesService } from '../../templates';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';

export type TStarredFilter = 'all' | 'starred' | 'unstarred';

export type TAllowedTemplateAction = 'send' | 'signnow' | 'submitted' | 'link' | 'edit';

const VisibilityFilters: IFilterOption[] = [
  { value: 'private_shared', label: 'Personal + Shared' },
  { value: 'private', label: 'Personal' },
  { value: 'shared', label: 'Shared' },
  { value: 'public', label: 'Public' },
];

const StarredFilters: IFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'starred', label: 'Starred' },
  { value: 'unstarred', label: 'Not Starred' },
];

const SortOptions: IFilterOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'last_used_at', label: 'Last Used' },
  { value: 'counter', label: 'Most Used' },
  { value: 'star_counter', label: 'Most Starred' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short' });

/**
 * Display a list of the templates in the caller's account, with filtering,
 * sorting, starring, and pagination. Row-level actions emit outputs so the
 * host application can route to its own views.
 */
@Component({
  selector: 'verdocs-templates-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsDropdownComponent,
    VerdocsPaginationComponent,
    VerdocsQuickFilterComponent,
    VerdocsSpinnerComponent,
    VerdocsTemplateStarComponent,
    VerdocsTextInputComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    <div class="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink">
      <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
        <verdocs-text-input
          class="vdocs:w-40 vdocs:[&_label]:mb-0"
          [value]="localNameFilter()"
          [clearable]="true"
          autocomplete="off"
          placeholder="Filter by Name..."
          (valueChange)="localNameFilter.set($event)"
          (blurred)="commitNameFilter($event)"
          (cleared)="commitNameFilter('')" />

        <verdocs-quick-filter
          label="Visibility"
          [value]="visibility()"
          [options]="visibilityFilters"
          (optionSelected)="onChangeVisibility($event)" />

        <verdocs-quick-filter
          label="Starred"
          [value]="starred()"
          [options]="starredFilters"
          (optionSelected)="onChangeStarred($event)" />

        <verdocs-quick-filter
          label="Sort By"
          [value]="sort()"
          [options]="sortOptions"
          (optionSelected)="onChangeSort($event)" />

        @if (query.isFetching() && query.data()) {
          <verdocs-spinner mode="dark" [size]="24" />
        }
        <div class="vdocs:flex vdocs:flex-1"></div>
      </div>

      @if (query.isPending()) {
        <div>
          @for (placeholder of placeholders(); track placeholder) {
            <div class="vdocs:h-12 vdocs:my-1 vdocs:rounded-row vdocs:bg-canvas vdocs:animate-pulse"></div>
          }
        </div>
      }

      @for (template of locallyFilteredTemplates(); track template.id) {
        <div
          class="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-accent-light/10 vdocs:hover:border-accent-light"
          (click)="emitTemplateEvent(viewTemplate, template)">
          <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
            <verdocs-template-star [template]="template" [endpoint]="endpoint()" (sdkError)="sdkError.emit($event)" />

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden"></div>
            <div class="vdocs:flex-1 vdocs:text-base vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">{{ template.name }}</div>

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden"></div>
            <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6">
                <title>Usage Counter</title>
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {{ template.counter || '--' }}
            </div>

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden"></div>
            <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-28">
              @switch (dateKind()) {
                @case ('created_at') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88" fill="currentColor" class="vdocs:size-6">
                    <title>Created</title>
                    <path d="M81.61,4.73c0-2.61,2.58-4.73,5.77-4.73c3.19,0,5.77,2.12,5.77,4.73v20.72c0,2.61-2.58,4.73-5.77,4.73 c-3.19,0-5.77-2.12-5.77-4.73V4.73L81.61,4.73z M66.11,103.81c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2H81.9 c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H66.11L66.11,103.81z M15.85,67.09c-0.34,0-0.61-1.43-0.61-3.2 c0-1.77,0.27-3.2,0.61-3.2h15.79c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H15.85L15.85,67.09z M40.98,67.09 c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2h15.79c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H40.98 L40.98,67.09z M66.11,67.09c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2H81.9c0.34,0,0.61,1.43,0.61,3.2 c0,1.77-0.27,3.2-0.61,3.2H66.11L66.11,67.09z M91.25,67.09c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2h15.79 c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H91.25L91.25,67.09z M15.85,85.45c-0.34,0-0.61-1.43-0.61-3.2 c0-1.77,0.27-3.2,0.61-3.2h15.79c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H15.85L15.85,85.45z M40.98,85.45 c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2h15.79c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H40.98 L40.98,85.45z M66.11,85.45c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2H81.9c0.34,0,0.61,1.43,0.61,3.2 c0,1.77-0.27,3.2-0.61,3.2H66.11L66.11,85.45z M91.25,85.45c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2h15.79 c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H91.25L91.25,85.45z M15.85,103.81c-0.34,0-0.61-1.43-0.61-3.2 c0-1.77,0.27-3.2,0.61-3.2h15.79c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H15.85L15.85,103.81z M40.98,103.81 c-0.34,0-0.61-1.43-0.61-3.2c0-1.77,0.27-3.2,0.61-3.2h15.79c0.34,0,0.61,1.43,0.61,3.2c0,1.77-0.27,3.2-0.61,3.2H40.98 L40.98,103.81z M29.61,4.73c0-2.61,2.58-4.73,5.77-4.73s5.77,2.12,5.77,4.73v20.72c0,2.61-2.58,4.73-5.77,4.73 s-5.77-2.12-5.77-4.73V4.73L29.61,4.73z M6.4,45.32h110.07V21.47c0-0.8-0.33-1.53-0.86-2.07c-0.53-0.53-1.26-0.86-2.07-0.86H103 c-1.77,0-3.2-1.43-3.2-3.2c0-1.77,1.43-3.2,3.2-3.2h10.55c2.57,0,4.9,1.05,6.59,2.74c1.69,1.69,2.74,4.02,2.74,6.59v27.06v65.03 c0,2.57-1.05,4.9-2.74,6.59c-1.69,1.69-4.02,2.74-6.59,2.74H9.33c-2.57,0-4.9-1.05-6.59-2.74C1.05,118.45,0,116.12,0,113.55V48.52 V21.47c0-2.57,1.05-4.9,2.74-6.59c1.69-1.69,4.02-2.74,6.59-2.74H20.6c1.77,0,3.2,1.43,3.2,3.2c0,1.77-1.43,3.2-3.2,3.2H9.33 c-0.8,0-1.53,0.33-2.07,0.86c-0.53,0.53-0.86,1.26-0.86,2.07V45.32L6.4,45.32z M116.48,51.73H6.4v61.82c0,0.8,0.33,1.53,0.86,2.07 c0.53,0.53,1.26,0.86,2.07,0.86h104.22c0.8,0,1.53-0.33,2.07-0.86c0.53-0.53,0.86-1.26,0.86-2.07V51.73L116.48,51.73z M50.43,18.54 c-1.77,0-3.2-1.43-3.2-3.2c0-1.77,1.43-3.2,3.2-3.2h21.49c1.77,0,3.2,1.43,3.2,3.2c0,1.77-1.43,3.2-3.2,3.2H50.43L50.43,18.54z" />
                  </svg>
                }
                @case ('updated_at') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 506.49" fill="currentColor" class="vdocs:size-6">
                    <title>Last Updated</title>
                    <path fill-rule="nonzero" d="m371.06 415.61-43.25 11.52 6.23-46.41 37.02 34.89zm6.76-177.5c36.98 0 70.56 15.04 94.83 39.35C496.96 301.7 512 335.25 512 372.31c0 37.02-15.02 70.61-39.3 94.88l-.68.64c-24.23 23.88-57.5 38.66-94.2 38.66-37.06 0-70.61-15.04-94.88-39.31l-.64-.69c-23.9-24.24-38.68-57.53-38.68-94.18 0-37.06 15.04-70.61 39.32-94.89 24.27-24.27 57.85-39.31 94.88-39.31zm78.74 55.41c-20.09-20.11-47.96-32.58-78.74-32.58-30.75 0-58.61 12.47-78.75 32.62-20.15 20.14-32.62 48-32.62 78.75 0 30.5 12.25 58.14 32.02 78.19l.6.55c20.14 20.14 48 32.61 78.75 32.61 30.48 0 58.12-12.25 78.21-32.02l.54-.58c20.15-20.15 32.61-48 32.61-78.75s-12.48-58.61-32.62-78.79zM294.24 17.11C294.24 7.69 303.52 0 315.1 0c11.57 0 20.87 7.64 20.87 17.11v74.85c0 9.42-9.3 17.11-20.87 17.11-11.58 0-20.86-7.65-20.86-17.11V17.11zM56.8 242.28c-1.17 0-2.23-5.2-2.23-11.57 0-6.38.92-11.53 2.23-11.53h56.94c1.18 0 2.24 5.2 2.24 11.53 0 6.39-.92 11.57-2.24 11.57H56.8zm90.77 0c-1.17 0-2.23-5.2-2.23-11.57 0-6.38.92-11.53 2.23-11.53h56.94c1.18 0 2.24 5.2 2.24 11.53 0 6.39-.92 11.57-2.24 11.57h-56.94zm90.77 0c-1.16 0-2.22-5.2-2.22-11.57 0-6.38.92-11.53 2.22-11.53h56.94c1.19 0 2.25 5.15 2.25 11.49-5.7 3.55-11.2 7.44-16.43 11.61h-42.76zm-181.4 66.24c-1.18 0-2.24-5.2-2.24-11.57 0-6.38.93-11.58 2.24-11.58h56.94c1.18 0 2.22 5.2 2.22 11.58 0 6.37-.91 11.57-2.22 11.57H56.94zm90.77 0c-1.18 0-2.24-5.2-2.24-11.57 0-6.38.93-11.58 2.24-11.58h56.94c1.18 0 2.23 5.2 2.23 11.58 0 6.37-.92 11.57-2.23 11.57h-56.94zM57.06 374.8c-1.18 0-2.24-5.2-2.24-11.59 0-6.36.94-11.56 2.24-11.56H114c1.19 0 2.24 5.2 2.24 11.56 0 6.39-.93 11.59-2.24 11.59H57.06zm90.78 0c-1.19 0-2.25-5.2-2.25-11.59 0-6.36.94-11.56 2.25-11.56h56.94c1.18 0 2.24 5.2 2.24 11.56 0 6.39-.94 11.59-2.24 11.59h-56.94zM106.83 17.11C106.83 7.69 116.1 0 127.69 0c11.57 0 20.86 7.64 20.86 17.11v74.85c0 9.42-9.34 17.11-20.86 17.11-11.59 0-20.86-7.65-20.86-17.11V17.11zM22.97 163.64h397.39V77.46c0-2.94-1.19-5.53-3.09-7.43-1.9-1.9-4.59-3.08-7.42-3.08h-38.1c-6.39 0-11.59-5.2-11.59-11.57 0-6.38 5.2-11.58 11.59-11.58h38.1c9.32 0 17.7 3.77 23.82 9.88 6.12 6.14 9.88 14.5 9.88 23.83v136.81c-7.61-2.62-15.41-4.73-23.44-6.29v-21.38h.25H22.97v223.17c0 2.94 1.18 5.52 3.08 7.42 1.91 1.9 4.61 3.08 7.44 3.08h188.85c2.16 8.02 4.86 15.84 8.11 23.36H33.71c-9.3 0-17.7-3.75-23.84-9.89C3.75 427.72 0 419.36 0 410.02V77.55c0-9.29 3.75-17.7 9.87-23.82 6.14-6.13 14.5-9.89 23.84-9.89h40.67c6.38 0 11.57 5.2 11.57 11.57C85.95 61.8 80.76 67 74.38 67H33.71c-2.96 0-5.54 1.18-7.44 3.08-1.9 1.9-3.09 4.59-3.09 7.43v86.16h-.21v-.03zm158.95-96.69c-6.39 0-11.57-5.2-11.57-11.57 0-6.38 5.18-11.58 11.57-11.58h77.55c6.39 0 11.57 5.2 11.57 11.58 0 6.37-5.18 11.57-11.57 11.57h-77.55zm161.66 303.24 45.37-51.33c.72-.84 1.78-1.34 2.85-1.36.69-.01 1.37.13 1.98.45l32.94 29.96c.66.59 1.05 1.46 1.06 2.35.02 1-.39 1.98-1.16 2.66l-46.15 52.16-36.95-34.89h.06z" />
                  </svg>
                }
                @default {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 410.2" fill="currentColor" class="vdocs:size-6">
                    <title>Last Used</title>
                    <path d="M35.28 35.51h32.54v43.42c0 10.58 4.27 20.06 11.35 27.23 17.03 17.14 45.5 17.45 63.06.93 7.71-7.29 12.4-17.14 12.4-28.16V35.51h65.71v43.42c0 6.34 1.56 12.3 4.35 17.6 2.03 3.85 4.71 7.37 7.92 10.43l2.41 2.24c1.79 1.46 3.71 2.79 5.76 3.97l1.31.69c1.11-.64 2.17-1.31 3.2-2.03l2.71-1.95c4.36-3.56 7.92-7.88 10.43-12.76 2.73-5.26 4.25-11.19 4.25-17.5V35.51h33.97c9.68 0 18.5 3.98 24.91 10.38 6.4 6.37 10.38 15.2 10.38 24.9V192.9H365.1v-53.83H11.3v233.49c0 15.25 12.49 27.74 27.75 27.74h298.3c15.27 0 27.75-12.51 27.75-27.74V325.6h11.31v49.32c0 9.7-3.98 18.53-10.37 24.91-6.42 6.39-15.24 10.37-24.92 10.37H35.28c-9.68 0-18.49-3.97-24.89-10.37C3.97 393.41 0 384.59 0 374.92V70.79C0 61.12 3.97 52.3 10.36 45.9c6.43-6.42 15.25-10.39 24.92-10.39zm211.43-21.54c0-7.71 7.61-13.97 17.03-13.97 9.42 0 17.04 6.26 17.04 13.97v64.96c0 7.7-7.62 13.96-17.04 13.96-9.42 0-17.03-6.26-17.03-13.96V13.97zm-152.52 0C94.19 6.26 101.81 0 111.23 0c9.42 0 17.03 6.26 17.03 13.97v64.96c0 7.7-7.61 13.96-17.03 13.96-9.42 0-17.04-6.26-17.04-13.96V13.97zm311.37 327.72c1.48-14.79 2.69-32.45 3.59-46.5h-75.88v-71.88h77.43c-.39-14.06-1.17-31.75-2.35-46.58-.96-5.93 6.02-9.73 10.51-5.9l90.89 82.99c2.7 2.31 3.02 6.38.7 9.08l-.74.73-93.65 84.05c-4.6 3.89-11.47-.19-10.5-5.99zM63.51 286h50.56c3.53 0 6.43 2.91 6.43 6.44v42.06c0 3.52-2.91 6.44-6.43 6.44H63.51c-3.53 0-6.44-2.91-6.44-6.44v-42.06c0-3.54 2.9-6.44 6.44-6.44zm198.44-98.62h50.55c3.23 0 5.92 2.43 6.37 5.52h-16v49.42h-40.92c-3.53 0-6.45-2.9-6.45-6.45v-42.05c0-3.54 2.9-6.44 6.45-6.44zm0 98.62h40.92v39.6h16.07v8.9c0 3.52-2.92 6.44-6.44 6.44h-50.55c-3.53 0-6.45-2.91-6.45-6.44v-42.06c0-3.54 2.9-6.44 6.45-6.44zm-98.5-98.62h50.56c3.53 0 6.43 2.92 6.43 6.44v42.05c0 3.53-2.91 6.45-6.43 6.45h-50.56c-3.53 0-6.44-2.9-6.44-6.45v-42.05c0-3.54 2.9-6.44 6.44-6.44zm-99.94 0h50.56c3.53 0 6.43 2.92 6.43 6.44v42.05c0 3.53-2.91 6.45-6.43 6.45H63.51c-3.53 0-6.44-2.9-6.44-6.45v-42.05c0-3.54 2.9-6.44 6.44-6.44zM163.45 286h50.56c3.53 0 6.43 2.91 6.43 6.44v42.06c0 3.52-2.91 6.44-6.43 6.44h-50.56c-3.53 0-6.44-2.91-6.44-6.44v-42.06c0-3.54 2.9-6.44 6.44-6.44z" />
                  </svg>
                }
              }
              {{ dateLabel(template) }}
            </div>

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden"></div>
            <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-20">
              @if (template.is_public) {
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Public
              } @else if (template.is_personal) {
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                Shared
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Private
              }
            </div>

            <verdocs-dropdown [options]="menuOptions(template)" (optionSelected)="onMenuSelect($event, template)" />
          </div>
        </div>
      }

      @if (!query.isPending() && !(query.data()?.templates ?? []).length) {
        <div class="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge">
          No matching templates found. Please adjust your filters and try again.
        </div>
      }

      @if (!query.isPending() && (query.data()?.templates ?? []).length && showPagination()) {
        <div class="vdocs:mt-5">
          <verdocs-pagination
            [selectedPage]="selectedPage()"
            [perPage]="rowsPerPage()"
            [itemCount]="query.data()?.count ?? 0"
            (selectPage)="selectedPage.set($event)" />
        </div>
      }
    </div>
  `,
})
export class VerdocsTemplatesListComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The initial visibility setting to filter by. */
  readonly initialVisibility = input<TTemplateVisibilityFilter>('private_shared');
  /** The initial starred setting to filter by. */
  readonly initialStarred = input<TStarredFilter>('all');
  /** The initial sort order to display. */
  readonly initialSort = input<TSortTemplateBy>('updated_at');
  /** The initial name filter, if any. */
  readonly initialName = input('');
  /** The row actions to offer in each row's dropdown menu. */
  readonly allowedActions = input<TAllowedTemplateAction[]>([ 'send', 'signnow', 'submitted', 'link', 'edit' ]);
  /** Whether pagination should be enabled. */
  readonly showPagination = input(true);
  /** The number of rows to display per page. */
  readonly rowsPerPage = input(10);
  /** The initial page number to select. */
  readonly initialPage = input(0);

  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();
  /**
   * Emitted when the user clicks a template row, or selects "Preview / Send"
   * from the row menu. Typically used to route to the template preview.
   */
  readonly viewTemplate = output<ITemplateEvent>();
  /** Emitted when the user selects "Submissions" from the row menu. */
  readonly submittedData = output<ITemplateEvent>();
  /** Emitted when the user selects "Edit" from the row menu. */
  readonly editTemplate = output<ITemplateEvent>();
  /** Emitted when the user changes the sort order. Useful for saving preferences. */
  readonly changeSort = output<TSortTemplateBy>();
  /** Emitted when the user changes the visibility filter. Useful for saving preferences. */
  readonly changeVisibility = output<TTemplateVisibilityFilter>();
  /** Emitted when the user changes the starred filter. Useful for saving preferences. */
  readonly changeStarred = output<TStarredFilter>();
  /**
   * Emitted when the user commits a change to the name filter. Fired on blur
   * rather than every keystroke; unlike the other filters, search terms are
   * usually not worth persisting.
   */
  readonly changeName = output<string>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly templatesService = inject(VerdocsTemplatesService);

  protected readonly visibilityFilters = VisibilityFilters;
  protected readonly starredFilters = StarredFilters;
  protected readonly sortOptions = SortOptions;

  // Each filter follows its initial-value input until the user changes it.
  protected readonly visibility = linkedSignal(() => this.initialVisibility());
  protected readonly starred = linkedSignal(() => this.initialStarred());
  protected readonly sort = linkedSignal(() => this.initialSort());
  protected readonly name = linkedSignal(() => this.initialName());
  protected readonly localNameFilter = linkedSignal(() => this.initialName());
  protected readonly selectedPage = linkedSignal(() => this.initialPage());

  protected readonly profile = signal<IProfile | null>(null);

  private readonly params = computed(() => {
    const queryParams: IGetTemplatesParams = {
      visibility: this.visibility(),
      sort_by: this.sort(),
      page: this.selectedPage(),
      rows: this.rowsPerPage(),
    };

    if (this.starred() !== 'all') {
      queryParams.is_starred = this.starred() === 'starred';
    }

    if (this.name().trim() !== '') {
      queryParams.q = this.name().trim();
    }

    return queryParams;
  });

  protected readonly query = this.templatesService.templates(this.params, this.endpoint);

  protected readonly placeholders = computed(() => Array.from({ length: this.rowsPerPage() }, (_, i) => i));

  // In addition to the server query we also filter locally. This provides a
  // faster UI update while typing; the commit on blur re-queries the server
  // for any records that newly qualify.
  protected readonly locallyFilteredTemplates = computed(() => {
    const templates = this.query.data()?.templates ?? [];
    const filter = this.localNameFilter().toLowerCase();
    return filter ? templates.filter(t => t.name.toLowerCase().includes(filter)) : templates;
  });

  constructor() {
    effect(onCleanup => {
      const endpoint = this.resolvedEndpoint();
      const unsubscribe = endpoint.onSessionChanged((_endpoint, _session, profile) => this.profile.set(profile));
      endpoint.loadSession();
      onCleanup(unsubscribe);
    });

    effect(() => {
      const error = this.query.error();
      if (error) {
        const details = error as { message: string; response?: { status?: number; data?: unknown } };
        this.sdkError.emit(new SDKError(details.message, details.response?.status, details.response?.data));
      }
    });
  }

  private readonly resolvedEndpoint = computed(() => {
    const resolved = this.endpoint() ?? this.injectedEndpoint;
    if (!resolved) {
      throw new Error('verdocs-templates-list needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected readonly dateKind = computed(() => {
    const sort = this.sort();
    return sort === 'created_at' ? 'created_at' : sort === 'updated_at' ? 'updated_at' : 'last_used_at';
  });

  protected dateLabel(template: ITemplate) {
    const date = template[this.dateKind()];
    return date ? dateFormatter.format(new Date(date)) : 'Never';
  }

  protected menuOptions(template: ITemplate): IMenuOption[] {
    const allowed = this.allowedActions();
    const options: IMenuOption[] = [];
    const canRead = canPerformTemplateAction(this.profile(), 'read', template).canPerform;

    if (allowed.includes('send')) {
      options.push({ label: 'Preview / Send', id: 'send', disabled: !canRead });
    }

    if (allowed.includes('signnow')) {
      // Not yet available; kept visible so users can discover it is coming.
      options.push({ label: 'Sign Now', id: 'signnow', disabled: true });
    }

    if (allowed.includes('submitted')) {
      options.push({ label: '' });
      options.push({ label: 'Submissions', id: 'submitted', disabled: !canRead });
    }

    if (allowed.includes('edit')) {
      options.push({ label: '' });
      options.push({ label: 'Edit', id: 'edit', disabled: !canPerformTemplateAction(this.profile(), 'write', template).canPerform });
    }

    return options;
  }

  protected emitTemplateEvent(emitter: { emit: (event: ITemplateEvent) => void }, template: ITemplate) {
    emitter.emit({ endpoint: this.resolvedEndpoint(), template });
  }

  protected onMenuSelect(option: IMenuOption, template: ITemplate) {
    switch (option.id) {
      case 'send':
        this.emitTemplateEvent(this.viewTemplate, template);
        break;
      case 'submitted':
        this.emitTemplateEvent(this.submittedData, template);
        break;
      case 'edit':
        this.emitTemplateEvent(this.editTemplate, template);
        break;
      default:
        break;
    }
  }

  protected commitNameFilter(committed: string) {
    const trimmed = committed.trim();
    this.name.set(trimmed);
    this.localNameFilter.set(trimmed);
    this.selectedPage.set(0);
    this.changeName.emit(trimmed);
  }

  protected onChangeVisibility(option: IFilterOption) {
    this.visibility.set(option.value as TTemplateVisibilityFilter);
    this.selectedPage.set(0);
    this.changeVisibility.emit(option.value as TTemplateVisibilityFilter);
  }

  protected onChangeStarred(option: IFilterOption) {
    this.starred.set(option.value as TStarredFilter);
    this.selectedPage.set(0);
    this.changeStarred.emit(option.value as TStarredFilter);
  }

  protected onChangeSort(option: IFilterOption) {
    this.sort.set(option.value as TSortTemplateBy);
    this.changeSort.emit(option.value as TSortTemplateBy);
  }
}
