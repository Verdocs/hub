import { html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { canPerformTemplateAction } from '@verdocs/js-sdk';
import type { IGetTemplatesParams, ITemplate, TSortTemplateBy, TTemplateVisibilityFilter, VerdocsEndpoint } from '@verdocs/js-sdk';
import { buildingOfficeIcon, calendarCreatedIcon, calendarLastUsedIcon, calendarUpdatedIcon, envelopeIcon, globeAltIcon, lockClosedIcon } from '../controls/icons/index.js';
import type { IFilterOption } from '../controls/vdocs-quick-filter.js';
import { SessionController } from '../base/session-controller.js';
import type { IMenuOption } from '../controls/vdocs-dropdown.js';
import { TemplatesController } from '../store/templates.js';
import { SDKError, type ITemplateEvent } from '../types.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-quick-filter.js';
import '../controls/vdocs-pagination.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-dropdown.js';
import '../controls/vdocs-spinner.js';

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
 * sorting, and pagination. Row-level actions fire events so the host
 * application can route to its own views. Uses the default endpoint unless
 * the `endpoint` property is set.
 *
 * The star column present in the React SDK is omitted here: star features
 * are frozen pending the retirement decision, so this mirror never grew one.
 *
 * @fires vdocs-view-template - Fired with an ITemplateEvent in detail when the user clicks a row or selects "Preview / Send" from the row menu.
 * @fires vdocs-submitted-data - Fired with an ITemplateEvent in detail when the user selects "Submissions" from the row menu.
 * @fires vdocs-edit-template - Fired with an ITemplateEvent in detail when the user selects "Edit" from the row menu.
 * @fires vdocs-change-sort - Fired with the new sort order in detail. Useful for saving preferences.
 * @fires vdocs-change-visibility - Fired with the new visibility filter in detail. Useful for saving preferences.
 * @fires vdocs-change-starred - Fired with the new starred filter in detail. Useful for saving preferences.
 * @fires vdocs-change-name - Fired with the committed name filter in detail, on blur rather than every keystroke.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if an error occurs.
 */
export class VdocsTemplatesList extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    visibility: { type: String },
    starred: { type: String },
    sort: { type: String },
    name: { type: String },
    allowedActions: { attribute: false },
    showPagination: { attribute: false },
    rowsPerPage: { type: Number, attribute: 'rows-per-page' },
    initialPage: { type: Number, attribute: 'initial-page' },
    currentVisibility: { state: true },
    currentStarred: { state: true },
    currentSort: { state: true },
    committedName: { state: true },
    localNameFilter: { state: true },
    selectedPage: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The initial visibility setting to filter by. */
  declare visibility: TTemplateVisibilityFilter;
  /** The initial starred setting to filter by. */
  declare starred: TStarredFilter;
  /** The initial sort order to display. */
  declare sort: TSortTemplateBy;
  /** The initial name filter, if any. */
  declare name: string;
  /** The row actions to offer in each row's dropdown menu. Property-only. */
  declare allowedActions: TAllowedTemplateAction[];
  /** Whether pagination should be enabled. Property-only (defaults to true). */
  declare showPagination: boolean;
  /** The number of rows to display per page. */
  declare rowsPerPage: number;
  /** The initial page number to select. */
  declare initialPage: number;

  private declare currentVisibility: TTemplateVisibilityFilter;
  private declare currentStarred: TStarredFilter;
  private declare currentSort: TSortTemplateBy;
  private declare committedName: string;
  private declare localNameFilter: string;
  private declare selectedPage: number;

  private session = new SessionController(this, () => this.resolvedEndpoint);

  private query = new TemplatesController(
    this,
    () => ({ params: this.params, endpoint: this.resolvedEndpoint }),
    error => {
      const details = error as { message: string; response?: { status?: number; data?: unknown } };
      this.emit('vdocs-sdk-error', new SDKError(details.message, details.response?.status, details.response?.data));
    },
  );

  constructor() {
    super();
    this.visibility = 'private_shared';
    this.starred = 'all';
    this.sort = 'updated_at';
    this.name = '';
    this.allowedActions = [ 'send', 'signnow', 'submitted', 'link', 'edit' ];
    this.showPagination = true;
    this.rowsPerPage = 10;
    this.initialPage = 0;
    this.currentVisibility = this.visibility;
    this.currentStarred = this.starred;
    this.currentSort = this.sort;
    this.committedName = '';
    this.localNameFilter = '';
    this.selectedPage = 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override willUpdate(changed: PropertyValues<this>) {
    // Each filter follows its public property until the user changes it,
    // mirroring the initial-value semantics of the React props.
    if (changed.has('visibility')) {
      this.currentVisibility = this.visibility;
    }

    if (changed.has('starred')) {
      this.currentStarred = this.starred;
    }

    if (changed.has('sort')) {
      this.currentSort = this.sort;
    }

    if (changed.has('name')) {
      this.committedName = this.name;
      this.localNameFilter = this.name;
    }

    if (changed.has('initialPage')) {
      this.selectedPage = this.initialPage;
    }
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get params(): IGetTemplatesParams {
    const queryParams: IGetTemplatesParams = {
      visibility: this.currentVisibility,
      sort_by: this.currentSort,
      page: this.selectedPage,
      rows: this.rowsPerPage,
    };

    if (this.currentStarred !== 'all') {
      queryParams.is_starred = this.currentStarred === 'starred';
    }

    if (this.committedName.trim() !== '') {
      queryParams.q = this.committedName.trim();
    }

    return queryParams;
  }

  /** Refetch the current page, bypassing the cache freshness window. */
  refresh(): Promise<void> {
    return this.query.refresh();
  }

  private emitTemplateEvent(type: `vdocs-${string}`, template: ITemplate) {
    this.emit<ITemplateEvent>(type, { endpoint: this.resolvedEndpoint, template });
  }

  private handleMenuSelect(option: IMenuOption, template: ITemplate) {
    switch (option.id) {
      case 'send':
        this.emitTemplateEvent('vdocs-view-template', template);
        break;
      case 'submitted':
        this.emitTemplateEvent('vdocs-submitted-data', template);
        break;
      case 'edit':
        this.emitTemplateEvent('vdocs-edit-template', template);
        break;
      default:
        break;
    }
  }

  private buildMenuOptions(template: ITemplate): IMenuOption[] {
    const menuOptions: IMenuOption[] = [];
    const canRead = canPerformTemplateAction(this.session.profile, 'read', template).canPerform;

    if (this.allowedActions.includes('send')) {
      menuOptions.push({ label: 'Preview / Send', id: 'send', disabled: !canRead });
    }

    if (this.allowedActions.includes('signnow')) {
      // Not yet available; kept visible so users can discover it is coming.
      menuOptions.push({ label: 'Sign Now', id: 'signnow', disabled: true });
    }

    if (this.allowedActions.includes('submitted')) {
      menuOptions.push({ label: '' });
      menuOptions.push({ label: 'Submissions', id: 'submitted', disabled: !canRead });
    }

    if (this.allowedActions.includes('edit')) {
      menuOptions.push({ label: '' });
      menuOptions.push({ label: 'Edit', id: 'edit', disabled: !canPerformTemplateAction(this.session.profile, 'write', template).canPerform });
    }

    return menuOptions;
  }

  private commitNameFilter(committed: string) {
    const trimmed = committed.trim();
    this.committedName = trimmed;
    this.localNameFilter = trimmed;
    this.selectedPage = 0;
    this.emit('vdocs-change-name', trimmed);
  }

  private changeVisibility(option: IFilterOption) {
    this.currentVisibility = option.value as TTemplateVisibilityFilter;
    this.selectedPage = 0;
    this.emit('vdocs-change-visibility', option.value as TTemplateVisibilityFilter);
  }

  private changeStarred(option: IFilterOption) {
    this.currentStarred = option.value as TStarredFilter;
    this.selectedPage = 0;
    this.emit('vdocs-change-starred', option.value as TStarredFilter);
  }

  private changeSort(option: IFilterOption) {
    this.currentSort = option.value as TSortTemplateBy;
    this.emit('vdocs-change-sort', option.value as TSortTemplateBy);
  }

  private renderRow(template: ITemplate, dateToShow: 'created_at' | 'updated_at' | 'last_used_at') {
    const date = template[dateToShow];
    const divider = html`<div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden"></div>`;

    return html`
      <div
        class="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-accent-light/10 vdocs:hover:border-accent-light"
        @click=${() => this.emitTemplateEvent('vdocs-view-template', template)}>
        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
          <div class="vdocs:flex-1 vdocs:text-base vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">${template.name}</div>

          ${divider}
          <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap">
            ${envelopeIcon({ className: 'vdocs:size-6', title: 'Usage Counter' })}
            ${template.counter || '--'}
          </div>

          ${divider}
          <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-28">
            ${dateToShow === 'created_at' ? calendarCreatedIcon({ className: 'vdocs:size-6', title: 'Created' }) : nothing}
            ${dateToShow === 'updated_at' ? calendarUpdatedIcon({ className: 'vdocs:size-6', title: 'Last Updated' }) : nothing}
            ${dateToShow === 'last_used_at' ? calendarLastUsedIcon({ className: 'vdocs:size-6', title: 'Last Used' }) : nothing}
            ${date ? dateFormatter.format(new Date(date)) : 'Never'}
          </div>

          ${divider}
          <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-20">
            ${template.is_public ? html`${globeAltIcon({ className: 'vdocs:size-6' })} Public` : nothing}
            ${!template.is_public && !template.is_personal ? html`${lockClosedIcon({ className: 'vdocs:size-6' })} Private` : nothing}
            ${!template.is_public && template.is_personal ? html`${buildingOfficeIcon({ className: 'vdocs:size-6' })} Shared` : nothing}
          </div>

          <vdocs-dropdown
            .options=${this.buildMenuOptions(template)}
            @vdocs-select=${(e: CustomEvent<IMenuOption>) => this.handleMenuSelect(e.detail, template)}></vdocs-dropdown>
        </div>
      </div>`;
  }

  override render(): TemplateResult {
    const templates = this.query.data?.templates ?? [];
    const count = this.query.data?.count ?? 0;

    // In addition to the server query we also filter locally. This provides a
    // faster UI update while typing; the commit on blur re-queries the server
    // for any records that newly qualify.
    const locallyFilteredTemplates = !this.localNameFilter ?
      templates :
        templates.filter(t => t.name.toLowerCase().includes(this.localNameFilter.toLowerCase()));

    const dateToShow = this.currentSort === 'created_at' ? 'created_at' : this.currentSort === 'updated_at' ? 'updated_at' : 'last_used_at';

    return html`
      <div class="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink">
        <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
          <vdocs-text-input
            class="vdocs:w-40 vdocs:[&_label]:mb-0"
            clearable
            autocomplete="off"
            placeholder="Filter by Name..."
            .value=${this.localNameFilter}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.localNameFilter = e.detail.value;
            }}
            @vdocs-blur=${(e: CustomEvent<{ value: string }>) => this.commitNameFilter(e.detail.value)}
            @vdocs-clear=${() => this.commitNameFilter('')}></vdocs-text-input>

          <vdocs-quick-filter
            label="Visibility"
            .value=${this.currentVisibility}
            .options=${VisibilityFilters}
            @vdocs-select=${(e: CustomEvent<IFilterOption>) => this.changeVisibility(e.detail)}></vdocs-quick-filter>

          <vdocs-quick-filter
            label="Starred"
            .value=${this.currentStarred}
            .options=${StarredFilters}
            @vdocs-select=${(e: CustomEvent<IFilterOption>) => this.changeStarred(e.detail)}></vdocs-quick-filter>

          <vdocs-quick-filter
            label="Sort By"
            .value=${this.currentSort}
            .options=${SortOptions}
            @vdocs-select=${(e: CustomEvent<IFilterOption>) => this.changeSort(e.detail)}></vdocs-quick-filter>

          ${this.query.isFetching && this.query.data ? html`<vdocs-spinner mode="dark" size="24"></vdocs-spinner>` : nothing}
          <div class="vdocs:flex vdocs:flex-1"></div>
        </div>

        ${this.query.isPending ?
          html`
            <div>
              ${Array.from({ length: this.rowsPerPage }, () => html`
                <div class="vdocs:h-12 vdocs:my-1 vdocs:rounded-row vdocs:bg-canvas vdocs:animate-pulse"></div>`)}
            </div>` :
          nothing}

        ${locallyFilteredTemplates.map(template => this.renderRow(template, dateToShow))}

        ${!this.query.isPending && !templates.length ?
          html`
            <div class="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge">
              No matching templates found. Please adjust your filters and try again.
            </div>` :
          nothing}

        ${!this.query.isPending && templates.length > 0 && this.showPagination ?
          html`
            <div class="vdocs:mt-5">
              <vdocs-pagination
                .selectedPage=${this.selectedPage}
                .perPage=${this.rowsPerPage}
                .itemCount=${count}
                @vdocs-select-page=${(e: CustomEvent<{ page: number }>) => {
                  this.selectedPage = e.detail.page;
                }}></vdocs-pagination>
            </div>` :
          nothing}
      </div>`;
  }
}

register('vdocs-templates-list', VdocsTemplatesList);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-templates-list': VdocsTemplatesList;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-view-template': CustomEvent<ITemplateEvent>;
    'vdocs-submitted-data': CustomEvent<ITemplateEvent>;
    'vdocs-edit-template': CustomEvent<ITemplateEvent>;
    'vdocs-change-sort': CustomEvent<TSortTemplateBy>;
    'vdocs-change-visibility': CustomEvent<TTemplateVisibilityFilter>;
    'vdocs-change-starred': CustomEvent<TStarredFilter>;
    'vdocs-change-name': CustomEvent<string>;
  }
}
