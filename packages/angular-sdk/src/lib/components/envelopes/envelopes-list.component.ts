import { formatFullName, userCanCancelEnvelope } from '@verdocs/js-sdk';
import type { IEnvelope, IListEnvelopesParams, IProfile, TEnvelopeStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { VerdocsQuickFilterComponent, type IFilterOption } from '../../controls/quick-filter.component';
import { VerdocsDropdownComponent, type IMenuOption } from '../../controls/dropdown.component';
import { VerdocsPaginationComponent } from '../../controls/pagination.component';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsStatusIndicatorComponent } from './status-indicator.component';
import { VerdocsSpinnerComponent } from '../../controls/spinner.component';
import { VerdocsEnvelopesService } from '../../envelopes.service';
import { toSDKError } from '../../template-detail.service';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';
import { SDKError } from '../../types';

/**
 * The filtered view to display. "completed" shows envelopes that have been
 * submitted. "action" shows envelopes where the user is a recipient and the
 * envelope is not completed. "waiting" shows envelopes where the user is the
 * sender and the envelope is not completed.
 */
export type TEnvelopesListView = 'all' | 'inbox' | 'sent' | 'completed' | 'action' | 'waiting';

export type TEnvelopesSortBy = 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status';

/**
 * Payload for envelope-row outputs emitted by VerdocsEnvelopesListComponent
 * and the other envelope components.
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

/**
 * Display a list of the envelopes visible to the caller, with view, status,
 * and text filtering, sorting, and pagination. Row-level actions emit outputs
 * so the host application can route to its own views and confirm destructive
 * operations itself.
 */
@Component({
  selector: 'verdocs-envelopes-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsDropdownComponent,
    VerdocsPaginationComponent,
    VerdocsQuickFilterComponent,
    VerdocsSpinnerComponent,
    VerdocsStatusIndicatorComponent,
    VerdocsTextInputComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    <div class="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink vdocs:text-lg vdocs:max-md:text-sm">
      <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
        <verdocs-text-input
          class="vdocs:w-[300px] vdocs:[&_label]:mb-0"
          [value]="localMatch()"
          [clearable]="true"
          autocomplete="off"
          placeholder="Filter by Name, Recipient, or Field..."
          (valueChange)="localMatch.set($event)"
          (blurred)="commitMatchFilter($event)"
          (cleared)="commitMatchFilter('')" />

        <verdocs-quick-filter
          label="View"
          [value]="view() ?? ''"
          [options]="viewFilters"
          (optionSelected)="onChangeView($event)" />

        @if (view() === 'all') {
          <verdocs-quick-filter
            label="Status"
            [value]="status()"
            [options]="statusFilters"
            (optionSelected)="onChangeStatus($event)" />
        }

        @if (view() === 'all') {
          <verdocs-quick-filter
            label="Sort By"
            [value]="sort()"
            [options]="sortFilters"
            (optionSelected)="onChangeSort($event)" />
        }

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

      @for (envelope of envelopes(); track envelope.id) {
        <div
          class="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-canvas"
          (click)="emitEnvelopeEvent(viewEnvelope, envelope)">
          <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
            <!-- The legacy list's document glyph, kept local because nothing else uses it. -->
            <span class="vdocs:text-ink vdocs:max-md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" class="vdocs:size-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </span>

            <div class="vdocs:flex vdocs:flex-1 vdocs:leading-7 vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
              {{ envelope.name }}:&nbsp;
              <span class="vdocs:font-bold vdocs:text-muted vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
                {{ recipientNames(envelope) }}
              </span>
            </div>

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden"></div>
            <verdocs-status-indicator [envelope]="envelope" class="vdocs:w-[125px] vdocs:flex-none vdocs:max-md:text-sm" />

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden"></div>
            <div class="vdocs:flex vdocs:items-center vdocs:w-[180px] vdocs:flex-none vdocs:whitespace-nowrap vdocs:text-muted vdocs:max-md:hidden">
              {{ updatedAt(envelope) }}
            </div>

            <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden"></div>
            <verdocs-dropdown [options]="menuOptions(envelope)" (optionSelected)="onMenuSelect($event, envelope)" />
          </div>
        </div>
      }

      @if (!query.isPending() && !envelopes().length) {
        <div class="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge">
          No matching envelopes found. Please adjust your filters and try again.
        </div>
      }

      @if (!query.isPending() && envelopes().length && showPagination()) {
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
export class VerdocsEnvelopesListComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The initial view to filter by. When unset, all envelopes are shown. */
  readonly initialView = input<TEnvelopesListView>();
  /** The initial status to filter by. Only applied in the "all" view. */
  readonly initialStatus = input<TEnvelopeStatus | 'all'>('all');
  /** The initial sort order to display. Only applied in the "all" view. */
  readonly initialSort = input<TEnvelopesSortBy>('created_at');
  /** The initial name filter, if any. */
  readonly initialMatch = input('');
  /** Whether pagination should be enabled. */
  readonly showPagination = input(true);
  /** The number of rows to display per page. */
  readonly rowsPerPage = input(10);
  /** The initial page number to select. */
  readonly initialPage = input(0);

  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();
  /**
   * Emitted when the user clicks an envelope row, or selects "View Envelope"
   * from the row menu. Typically used to navigate to the envelope detail view.
   */
  readonly viewEnvelope = output<IEnvelopeEvent>();
  /** Emitted when the user selects "Download" from the row menu. */
  readonly download = output<IEnvelopeEvent>();
  /** Emitted when the user selects "Cancel" from the row menu. */
  readonly cancelEnvelope = output<IEnvelopeEvent>();
  /** Emitted when the user changes the view. Useful for saving preferences. */
  readonly changeView = output<TEnvelopesListView>();
  /** Emitted when the user changes the status filter. Useful for saving preferences. */
  readonly changeStatus = output<TEnvelopeStatus | 'all'>();
  /** Emitted when the user changes the sort order. Useful for saving preferences. */
  readonly changeSort = output<TEnvelopesSortBy>();
  /**
   * Emitted when the user commits a change to the match filter. Fired on blur
   * rather than every keystroke; unlike the other filters, search terms are
   * usually not worth persisting.
   */
  readonly changeMatch = output<string>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly envelopesService = inject(VerdocsEnvelopesService);

  protected readonly viewFilters = ViewFilters;
  protected readonly statusFilters = StatusFilters;
  protected readonly sortFilters = SortFilters;

  // Each filter follows its initial-value input until the user changes it.
  protected readonly view = linkedSignal(() => this.initialView());
  protected readonly status = linkedSignal(() => this.initialStatus());
  protected readonly sort = linkedSignal(() => this.initialSort());
  protected readonly match = linkedSignal(() => this.initialMatch());
  protected readonly localMatch = linkedSignal(() => this.initialMatch());
  protected readonly selectedPage = linkedSignal(() => this.initialPage());

  protected readonly profile = signal<IProfile | null>(null);

  private readonly params = computed(() => {
    const view = this.view();
    const status = this.status();
    const match = this.match();

    const queryParams: IListEnvelopesParams = {
      page: this.selectedPage(),
      rows: this.rowsPerPage(),
    };

    // The status arrays here mirror the legacy web-sdk exactly. The status
    // filter is only user-adjustable in the "all" view; the named views pin
    // their own statuses so a leftover filter (e.g. Inbox + Declined) can
    // never produce a permanently empty list.
    switch (view) {
      case 'all':
        queryParams.status = status === 'all' ? AllStatuses : [ status ];
        break;

      case 'inbox':
      case 'sent':
        queryParams.view = view;
        break;

      case 'action':
      case 'waiting':
        queryParams.view = view;
        queryParams.status = [ 'pending', 'in progress' ];
        break;

      case 'completed':
        queryParams.view = view;
        queryParams.status = [ 'complete' ];
        break;

      default:
        queryParams.status = status === 'all' ? AllStatuses : [ status ];
    }

    // Sorting is only user-adjustable in the "all" view (and the unset
    // default); the named views use the server's per-view ordering.
    if (view === 'all' || view === undefined) {
      queryParams.sort_by = this.sort();
    }

    if (match.trim() !== '') {
      queryParams.q = match.trim();
    }

    return queryParams;
  });

  protected readonly query = this.envelopesService.envelopes(this.params, this.endpoint);

  protected readonly envelopes = computed(() => this.query.data()?.envelopes ?? []);

  protected readonly placeholders = computed(() => Array.from({ length: this.rowsPerPage() }, (_, i) => i));

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
        this.sdkError.emit(toSDKError(error));
      }
    });
  }

  private readonly resolvedEndpoint = computed(() => {
    const resolved = this.endpoint() ?? this.injectedEndpoint;
    if (!resolved) {
      throw new Error('verdocs-envelopes-list needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected recipientNames(envelope: IEnvelope) {
    return (envelope.recipients || []).map(recipient => formatFullName(recipient)).join(', ');
  }

  protected updatedAt(envelope: IEnvelope) {
    return new Date(envelope.updated_at).toLocaleString();
  }

  protected menuOptions(envelope: IEnvelope): IMenuOption[] {
    return [
      { label: 'View Envelope', id: 'view' },
      { label: 'Download', id: 'download' },
      { label: 'Cancel', id: 'cancel', disabled: !userCanCancelEnvelope(this.profile(), envelope) },
    ];
  }

  protected emitEnvelopeEvent(emitter: { emit: (event: IEnvelopeEvent) => void }, envelope: IEnvelope) {
    emitter.emit({ endpoint: this.resolvedEndpoint(), envelope });
  }

  protected onMenuSelect(option: IMenuOption, envelope: IEnvelope) {
    switch (option.id) {
      case 'view':
        this.emitEnvelopeEvent(this.viewEnvelope, envelope);
        break;
      case 'download':
        this.emitEnvelopeEvent(this.download, envelope);
        break;
      case 'cancel':
        this.emitEnvelopeEvent(this.cancelEnvelope, envelope);
        break;
      default:
        break;
    }
  }

  protected commitMatchFilter(committed: string) {
    // Unlike the templates list we don't also filter locally while typing:
    // the match can hit recipients and field values, which only the server
    // can search efficiently.
    const trimmed = committed.trim();
    this.match.set(trimmed);
    this.localMatch.set(trimmed);
    this.selectedPage.set(0);
    this.changeMatch.emit(trimmed);
  }

  protected onChangeView(option: IFilterOption) {
    this.view.set(option.value as TEnvelopesListView);
    this.selectedPage.set(0);
    this.changeView.emit(option.value as TEnvelopesListView);
  }

  protected onChangeStatus(option: IFilterOption) {
    this.status.set(option.value as TEnvelopeStatus | 'all');
    this.selectedPage.set(0);
    this.changeStatus.emit(option.value as TEnvelopeStatus | 'all');
  }

  protected onChangeSort(option: IFilterOption) {
    this.sort.set(option.value as TEnvelopesSortBy);
    this.changeSort.emit(option.value as TEnvelopesSortBy);
  }
}
