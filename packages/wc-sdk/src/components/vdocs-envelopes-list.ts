import { html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { formatFullName, userCanCancelEnvelope } from '@verdocs/js-sdk';
import type { IEnvelope, IListEnvelopesParams, TEnvelopeStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IFilterOption } from '../controls/vdocs-quick-filter.js';
import { SessionController } from '../base/session-controller.js';
import type { IMenuOption } from '../controls/vdocs-dropdown.js';
import { EnvelopesListController } from '../store/envelopes.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-quick-filter.js';
import '../controls/vdocs-pagination.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-dropdown.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-spinner.js';
import './vdocs-status-indicator.js';

/**
 * The filtered view to display. "completed" shows envelopes that have been
 * submitted. "action" shows envelopes where the user is a recipient and the
 * envelope is not completed. "waiting" shows envelopes where the user is the
 * sender and the envelope is not completed.
 */
export type TEnvelopesListView = 'all' | 'inbox' | 'sent' | 'completed' | 'action' | 'waiting';

export type TEnvelopesSortBy = 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status';

/**
 * Payload for envelope-row events fired by vdocs-envelopes-list, and reused by
 * the recipient summary and sidebar. The mirror of react-sdk's IEnvelopeEvent.
 */
export interface IEnvelopeEvent {
  endpoint: VerdocsEndpoint;
  envelope: IEnvelope;
}

const ViewFilters: IFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent', label: 'Sent' },
  { value: 'completed', label: 'Completed' },
  { value: 'action', label: 'Action Required' },
  { value: 'waiting', label: 'Waiting on Others' },
];

const StatusFilters: IFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'complete', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
  { value: 'canceled', label: 'Canceled' },
];

const SortFilters: IFilterOption[] = [
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Updated' },
  { value: 'canceled_at', label: 'Canceled' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
];

const AllStatuses: TEnvelopeStatus[] = [ 'pending', 'in progress', 'complete', 'declined', 'canceled' ];

// The legacy list's document glyph, kept local because nothing else uses it.
const documentIcon = (): TemplateResult => html`
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" class="vdocs:size-6" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>`;

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' });

/**
 * Display a list of the envelopes visible to the caller, with view, status, and
 * text filtering, sorting, and pagination. Row-level actions fire events so the
 * host application can route to its own views and confirm destructive
 * operations itself. Uses the default endpoint unless the `endpoint` property
 * is set.
 *
 * @fires vdocs-view-envelope - Fired with an IEnvelopeEvent when the user clicks a row or selects "View Envelope".
 * @fires vdocs-download - Fired with an IEnvelopeEvent when the user selects "Download" (a different payload than the dialog's same-named event).
 * @fires vdocs-cancel-envelope - Fired with an IEnvelopeEvent when the user selects "Cancel".
 * @fires vdocs-change-view - Fired with the new view in detail. Useful for saving preferences.
 * @fires vdocs-change-status - Fired with the new status filter in detail. Useful for saving preferences.
 * @fires vdocs-change-sort - Fired with the new sort order (a TEnvelopesSortBy) in detail. Useful for saving preferences.
 * @fires vdocs-change-match - Fired with the committed match filter in detail, on blur rather than every keystroke.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if an error occurs.
 */
export class VdocsEnvelopesList extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    view: { type: String },
    status: { type: String },
    sort: { type: String },
    match: { type: String },
    showPagination: { attribute: false },
    rowsPerPage: { type: Number, attribute: 'rows-per-page' },
    initialPage: { type: Number, attribute: 'initial-page' },
    currentView: { state: true },
    currentStatus: { state: true },
    currentSort: { state: true },
    committedMatch: { state: true },
    localMatch: { state: true },
    selectedPage: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The initial view to filter by. When unset, all envelopes are shown. */
  declare view?: TEnvelopesListView;
  /** The initial status to filter by. Only applied in the "all" view. */
  declare status: TEnvelopeStatus | 'all';
  /** The initial sort order to display. Only applied in the "all" view. */
  declare sort: TEnvelopesSortBy;
  /** The initial name filter, if any. */
  declare match: string;
  /** Whether pagination should be enabled. Property-only (defaults to true). */
  declare showPagination: boolean;
  /** The number of rows to display per page. */
  declare rowsPerPage: number;
  /** The initial page number to select. */
  declare initialPage: number;

  private declare currentView?: TEnvelopesListView;
  private declare currentStatus: TEnvelopeStatus | 'all';
  private declare currentSort: TEnvelopesSortBy;
  private declare committedMatch: string;
  private declare localMatch: string;
  private declare selectedPage: number;

  private session = new SessionController(this, () => this.resolvedEndpoint);

  private query = new EnvelopesListController(
    this,
    () => ({ params: this.params, endpoint: this.resolvedEndpoint }),
    error => {
      const details = error as { message: string; response?: { status?: number; data?: unknown } };
      this.emit('vdocs-sdk-error', new SDKError(details.message, details.response?.status, details.response?.data));
    },
  );

  constructor() {
    super();
    this.status = 'all';
    this.sort = 'created_at';
    this.match = '';
    this.showPagination = true;
    this.rowsPerPage = 10;
    this.initialPage = 0;
    this.currentStatus = this.status;
    this.currentSort = this.sort;
    this.committedMatch = '';
    this.localMatch = '';
    this.selectedPage = 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override willUpdate(changed: PropertyValues<this>) {
    // Each filter follows its public property until the user changes it,
    // mirroring the initial-value semantics of the React props.
    if (changed.has('view')) {
      this.currentView = this.view;
    }

    if (changed.has('status')) {
      this.currentStatus = this.status;
    }

    if (changed.has('sort')) {
      this.currentSort = this.sort;
    }

    if (changed.has('match')) {
      this.committedMatch = this.match;
      this.localMatch = this.match;
    }

    if (changed.has('initialPage')) {
      this.selectedPage = this.initialPage;
    }
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get params(): IListEnvelopesParams {
    const queryParams: IListEnvelopesParams = {
      page: this.selectedPage,
      rows: this.rowsPerPage,
    };

    // The status arrays here mirror the legacy web-sdk exactly. The status
    // filter is only user-adjustable in the "all" view; the named views pin
    // their own statuses so a leftover filter (e.g. Inbox + Declined) can never
    // produce a permanently empty list.
    switch (this.currentView) {
      case 'all':
        queryParams.status = this.currentStatus === 'all' ? AllStatuses : [ this.currentStatus ];
        break;

      case 'inbox':
      case 'sent':
        queryParams.view = this.currentView;
        break;

      case 'action':
      case 'waiting':
        queryParams.view = this.currentView;
        queryParams.status = [ 'pending', 'in progress' ];
        break;

      case 'completed':
        queryParams.view = this.currentView;
        queryParams.status = [ 'complete' ];
        break;

      default:
        queryParams.status = this.currentStatus === 'all' ? AllStatuses : [ this.currentStatus ];
    }

    // Sorting is only user-adjustable in the "all" view (and the unset default);
    // the named views use the server's per-view ordering.
    if (this.currentView === 'all' || this.currentView === undefined) {
      queryParams.sort_by = this.currentSort;
    }

    if (this.committedMatch.trim() !== '') {
      queryParams.q = this.committedMatch.trim();
    }

    return queryParams;
  }

  /** Refetch the current page, bypassing the cache freshness window. */
  refresh(): Promise<void> {
    return this.query.refresh();
  }

  private emitEnvelopeEvent(type: `vdocs-${string}`, envelope: IEnvelope) {
    this.emit<IEnvelopeEvent>(type, { endpoint: this.resolvedEndpoint, envelope });
  }

  private handleMenuSelect(option: IMenuOption, envelope: IEnvelope) {
    switch (option.id) {
      case 'view':
        this.emitEnvelopeEvent('vdocs-view-envelope', envelope);
        break;
      case 'download':
        this.emitEnvelopeEvent('vdocs-download', envelope);
        break;
      case 'cancel':
        this.emitEnvelopeEvent('vdocs-cancel-envelope', envelope);
        break;
      default:
        break;
    }
  }

  private commitMatch(committed: string) {
    // Unlike the templates list we don't also filter locally while typing: the
    // match can hit recipients and field values, which only the server can
    // search efficiently.
    const trimmed = committed.trim();
    this.committedMatch = trimmed;
    this.localMatch = trimmed;
    this.selectedPage = 0;
    this.emit('vdocs-change-match', trimmed);
  }

  private changeView(option: IFilterOption) {
    this.currentView = option.value as TEnvelopesListView;
    this.selectedPage = 0;
    this.emit('vdocs-change-view', option.value as TEnvelopesListView);
  }

  private changeStatus(option: IFilterOption) {
    this.currentStatus = option.value as TEnvelopeStatus | 'all';
    this.selectedPage = 0;
    this.emit('vdocs-change-status', option.value as TEnvelopeStatus | 'all');
  }

  private changeSort(option: IFilterOption) {
    this.currentSort = option.value as TEnvelopesSortBy;
    this.emit('vdocs-change-sort', option.value as TEnvelopesSortBy);
  }

  private renderRow(envelope: IEnvelope): TemplateResult {
    const menuOptions: IMenuOption[] = [
      { label: 'View Envelope', id: 'view' },
      { label: 'Download', id: 'download' },
      { label: 'Cancel', id: 'cancel', disabled: !userCanCancelEnvelope(this.session.profile, envelope) },
    ];

    const recipients = (envelope.recipients || []).map(r => formatFullName(r)).join(', ');
    const divider = html`<div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden"></div>`;

    return html`
      <div
        class="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-canvas"
        @click=${() => this.emitEnvelopeEvent('vdocs-view-envelope', envelope)}>
        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
          <span class="vdocs:text-ink vdocs:max-md:hidden">${documentIcon()}</span>

          <div class="vdocs:flex vdocs:flex-1 vdocs:leading-7 vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
            ${envelope.name}:&nbsp;
            <span class="vdocs:font-bold vdocs:text-muted vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">${recipients}</span>
          </div>

          ${divider}
          <vdocs-status-indicator class="vdocs:w-[125px] vdocs:flex-none vdocs:max-md:text-sm" .envelope=${envelope}></vdocs-status-indicator>

          ${divider}
          <div class="vdocs:flex vdocs:items-center vdocs:w-[180px] vdocs:flex-none vdocs:whitespace-nowrap vdocs:text-muted vdocs:max-md:hidden">
            ${dateTimeFormatter.format(new Date(envelope.updated_at))}
          </div>

          ${divider}
          <vdocs-dropdown
            .options=${menuOptions}
            @vdocs-select=${(e: CustomEvent<IMenuOption>) => this.handleMenuSelect(e.detail, envelope)}></vdocs-dropdown>
        </div>
      </div>`;
  }

  override render(): TemplateResult {
    const envelopes = this.query.data?.envelopes ?? [];
    const count = this.query.data?.count ?? 0;

    return html`
      <div class="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink vdocs:text-lg vdocs:max-md:text-sm">
        <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
          <vdocs-text-input
            class="vdocs:w-[300px] vdocs:[&_label]:mb-0"
            clearable
            autocomplete="off"
            placeholder="Filter by Name, Recipient, or Field..."
            .value=${this.localMatch}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.localMatch = e.detail.value;
            }}
            @vdocs-blur=${(e: CustomEvent<{ value: string }>) => this.commitMatch(e.detail.value)}
            @vdocs-clear=${() => this.commitMatch('')}></vdocs-text-input>

          <vdocs-quick-filter
            label="View"
            .value=${this.currentView ?? ''}
            .options=${ViewFilters}
            @vdocs-select=${(e: CustomEvent<IFilterOption>) => this.changeView(e.detail)}></vdocs-quick-filter>

          ${this.currentView === 'all' ?
            html`
              <vdocs-quick-filter
                label="Status"
                .value=${this.currentStatus}
                .options=${StatusFilters}
                @vdocs-select=${(e: CustomEvent<IFilterOption>) => this.changeStatus(e.detail)}></vdocs-quick-filter>` :
            nothing}

          ${this.currentView === 'all' ?
            html`
              <vdocs-quick-filter
                label="Sort By"
                .value=${this.currentSort}
                .options=${SortFilters}
                @vdocs-select=${(e: CustomEvent<IFilterOption>) => this.changeSort(e.detail)}></vdocs-quick-filter>` :
            nothing}

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

        ${envelopes.map(envelope => this.renderRow(envelope))}

        ${!this.query.isPending && !envelopes.length ?
          html`
            <div class="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge">
              No matching envelopes found. Please adjust your filters and try again.
            </div>` :
          nothing}

        ${!this.query.isPending && envelopes.length > 0 && this.showPagination ?
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

register('vdocs-envelopes-list', VdocsEnvelopesList);

// Some list events reuse names already declared elsewhere, so we do not
// re-declare them here (TypeScript would reject a differing type for the same
// key): vdocs-sdk-error is declared by vdocs-auth, and vdocs-download is
// declared by the dialogs with a different payload (IDownloadSelection). The
// list fires vdocs-download with an IEnvelopeEvent; listen with an explicit
// cast, or handle it through the row menu. vdocs-change-sort is declared by
// vdocs-templates-list with the templates' sort union; the list fires it with
// a TEnvelopesSortBy, a different string set.
declare global {
  interface HTMLElementTagNameMap {
    'vdocs-envelopes-list': VdocsEnvelopesList;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-view-envelope': CustomEvent<IEnvelopeEvent>;
    'vdocs-cancel-envelope': CustomEvent<IEnvelopeEvent>;
    'vdocs-change-view': CustomEvent<TEnvelopesListView>;
    'vdocs-change-status': CustomEvent<TEnvelopeStatus | 'all'>;
    'vdocs-change-match': CustomEvent<string>;
  }
}
