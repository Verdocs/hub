import { useEffect, useMemo, useRef, useState } from 'react';
import { formatFullName, userCanCancelEnvelope } from '@verdocs/js-sdk';
import type { IEnvelope, IListEnvelopesParams, TEnvelopeStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import QuickFilter, { type IFilterOption } from '../../controls/QuickFilter';
import Dropdown, { type IMenuOption } from '../../controls/Dropdown';
import { useResolvedEndpoint } from '../../provider/VerdocsContext';
import StatusIndicator from '../envelopes/StatusIndicator';
import { useEnvelopes } from '../../hooks/useEnvelopes';
import { useSession } from '../../hooks/useSession';
import Pagination from '../../controls/Pagination';
import TextInput from '../../controls/TextInput';
import Spinner from '../../controls/Spinner';
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
 * Payload for envelope-row callbacks fired by VerdocsEnvelopesList.
 */
export interface IEnvelopeEvent {
  endpoint: VerdocsEndpoint;
  envelope: IEnvelope;
}

export interface VerdocsEnvelopesListProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The initial view to filter by. When unset, all envelopes are shown. */
  view?: TEnvelopesListView;
  /** The initial status to filter by. Only applied in the "all" view. */
  status?: TEnvelopeStatus | 'all';
  /** The initial sort order to display. Only applied in the "all" view. */
  sort?: TEnvelopesSortBy;
  /** The initial name filter, if any. */
  match?: string;
  /** Whether pagination should be enabled. */
  showPagination?: boolean;
  /** The number of rows to display per page. */
  rowsPerPage?: number;
  /** The initial page number to select. */
  initialPage?: number;

  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
  /**
   * Called when the user clicks an envelope row, or selects "View Envelope"
   * from the row menu. Typically used to navigate to the envelope detail view.
   */
  onViewEnvelope?: (event: IEnvelopeEvent) => void;
  /** Called when the user selects "Download" from the row menu. */
  onDownload?: (event: IEnvelopeEvent) => void;
  /** Called when the user selects "Cancel" from the row menu. */
  onCancelEnvelope?: (event: IEnvelopeEvent) => void;
  /** Called when the user changes the view. Useful for saving preferences. */
  onChangeView?: (view: TEnvelopesListView) => void;
  /** Called when the user changes the status filter. Useful for saving preferences. */
  onChangeStatus?: (status: TEnvelopeStatus | 'all') => void;
  /** Called when the user changes the sort order. Useful for saving preferences. */
  onChangeSort?: (sort: TEnvelopesSortBy) => void;
  /**
   * Called when the user commits a change to the match filter. Fired on blur
   * rather than every keystroke; unlike the other filters, search terms are
   * usually not worth persisting.
   */
  onChangeMatch?: (match: string) => void;
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

const AllStatuses: TEnvelopeStatus[] = ['pending', 'in progress', 'complete', 'declined', 'canceled'];

// The legacy list's document glyph, kept local because nothing else uses it.
function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="vdocs:size-6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

/**
 * Display a list of the envelopes visible to the caller, with view, status,
 * and text filtering, sorting, and pagination. Row-level actions fire
 * callbacks so the host application can route to its own views and confirm
 * destructive operations itself.
 */
export default function VerdocsEnvelopesList({
  endpoint,
  view: initialView,
  status: initialStatus = 'all',
  sort: initialSort = 'created_at',
  match: initialMatch = '',
  showPagination = true,
  rowsPerPage = 10,
  initialPage = 0,
  onSdkError,
  onViewEnvelope,
  onDownload,
  onCancelEnvelope,
  onChangeView,
  onChangeStatus,
  onChangeSort,
  onChangeMatch,
}: VerdocsEnvelopesListProps) {
  const resolvedEndpoint = useResolvedEndpoint(endpoint);
  const { profile } = useSession(endpoint);

  const [view, setView] = useState(initialView);
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(initialSort);
  const [match, setMatch] = useState(initialMatch);
  const [localMatch, setLocalMatch] = useState(initialMatch);
  const [selectedPage, setSelectedPage] = useState(initialPage);

  const params = useMemo(() => {
    const queryParams: IListEnvelopesParams = {
      page: selectedPage,
      rows: rowsPerPage,
    };

    // The status arrays here mirror the legacy web-sdk exactly. The status
    // filter is only user-adjustable in the "all" view; the named views pin
    // their own statuses so a leftover filter (e.g. Inbox + Declined) can
    // never produce a permanently empty list.
    switch (view) {
      case 'all':
        queryParams.status = status === 'all' ? AllStatuses : [status];
        break;

      case 'inbox':
      case 'sent':
        queryParams.view = view;
        break;

      case 'action':
      case 'waiting':
        queryParams.view = view;
        queryParams.status = ['pending', 'in progress'];
        break;

      case 'completed':
        queryParams.view = view;
        queryParams.status = ['complete'];
        break;

      default:
        queryParams.status = status === 'all' ? AllStatuses : [status];
    }

    // Sorting is only user-adjustable in the "all" view (and the unset
    // default); the named views use the server's per-view ordering.
    if (view === 'all' || view === undefined) {
      queryParams.sort_by = sort;
    }

    if (match.trim() !== '') {
      queryParams.q = match.trim();
    }

    return queryParams;
  }, [view, status, sort, match, selectedPage, rowsPerPage]);

  const query = useEnvelopes(params, endpoint);

  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (query.error) {
      const error = query.error as { message: string; response?: { status?: number; data?: unknown } };
      onSdkErrorRef.current?.(new SDKError(error.message, error.response?.status, error.response?.data));
    }
  }, [query.error]);

  const envelopes = query.data?.envelopes ?? [];
  const count = query.data?.count ?? 0;

  const handleMenuSelect = (option: IMenuOption, envelope: IEnvelope) => {
    const event: IEnvelopeEvent = { endpoint: resolvedEndpoint, envelope };
    switch (option.id) {
      case 'view':
        onViewEnvelope?.(event);
        break;
      case 'download':
        onDownload?.(event);
        break;
      case 'cancel':
        onCancelEnvelope?.(event);
        break;
      default:
        break;
    }
  };

  return (
    <div className="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink vdocs:text-lg vdocs:max-md:text-sm">
      <div className="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
        <div className="vdocs:w-[300px]">
          <TextInput
            value={localMatch}
            clearable
            autoComplete="off"
            placeholder="Filter by Name, Recipient, or Field..."
            className="vdocs:mb-0"
            onChange={e => setLocalMatch(e.target.value)}
            onBlur={e => {
              // Unlike the templates list we don't also filter locally while
              // typing: the match can hit recipients and field values, which
              // only the server can search efficiently.
              const committed = e.target.value.trim();
              setMatch(committed);
              setLocalMatch(committed);
              setSelectedPage(0);
              onChangeMatch?.(committed);
            }}
            onClear={() => {
              setMatch('');
              setLocalMatch('');
              setSelectedPage(0);
              onChangeMatch?.('');
            }}
          />
        </div>

        <QuickFilter
          label="View"
          value={view}
          options={ViewFilters}
          onChange={option => {
            setView(option.value as TEnvelopesListView);
            setSelectedPage(0);
            onChangeView?.(option.value as TEnvelopesListView);
          }}
        />

        {view === 'all' && (
          <QuickFilter
            label="Status"
            value={status}
            options={StatusFilters}
            onChange={option => {
              setStatus(option.value as TEnvelopeStatus | 'all');
              setSelectedPage(0);
              onChangeStatus?.(option.value as TEnvelopeStatus | 'all');
            }}
          />
        )}

        {view === 'all' && (
          <QuickFilter
            label="Sort By"
            value={sort}
            options={SortFilters}
            onChange={option => {
              setSort(option.value as TEnvelopesSortBy);
              onChangeSort?.(option.value as TEnvelopesSortBy);
            }}
          />
        )}

        {query.isFetching && query.data && <Spinner mode="dark" size={24} />}
        <div className="vdocs:flex vdocs:flex-1" />
      </div>

      {query.isPending && (
        <div>
          {Array.from({ length: rowsPerPage }, (_, i) => (
            <div key={i} className="vdocs:h-12 vdocs:my-1 vdocs:rounded-row vdocs:bg-canvas vdocs:animate-pulse" />
          ))}
        </div>
      )}

      {envelopes.map(envelope => {
        const menuOptions: IMenuOption[] = [
          { label: 'View Envelope', id: 'view' },
          { label: 'Download', id: 'download' },
          { label: 'Cancel', id: 'cancel', disabled: !userCanCancelEnvelope(profile, envelope) },
        ];

        return (
          <div
            key={envelope.id}
            className="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-canvas"
            onClick={() => onViewEnvelope?.({ endpoint: resolvedEndpoint, envelope })}>
            <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
              <span className="vdocs:text-ink vdocs:max-md:hidden">
                <DocumentIcon />
              </span>

              <div className="vdocs:flex vdocs:flex-1 vdocs:leading-7 vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
                {envelope.name}
                :&nbsp;
                <span className="vdocs:font-bold vdocs:text-muted vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
                  {(envelope.recipients || []).map(r => formatFullName(r)).join(', ')}
                </span>
              </div>

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden" />
              <StatusIndicator envelope={envelope} className="vdocs:w-[125px] vdocs:flex-none vdocs:max-md:text-sm" />

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden" />
              <div className="vdocs:flex vdocs:items-center vdocs:w-[180px] vdocs:flex-none vdocs:whitespace-nowrap vdocs:text-muted vdocs:max-md:hidden">
                {new Date(envelope.updated_at).toLocaleString()}
              </div>

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden" />
              <Dropdown options={menuOptions} onSelect={option => handleMenuSelect(option, envelope)} />
            </div>
          </div>
        );
      })}

      {!query.isPending && !envelopes.length && (
        <div className="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge">
          No matching envelopes found. Please adjust your filters and try again.
        </div>
      )}

      {!query.isPending && envelopes.length > 0 && showPagination && (
        <div className="vdocs:mt-5">
          <Pagination
            selectedPage={selectedPage}
            perPage={rowsPerPage}
            itemCount={count}
            onSelectPage={setSelectedPage}
          />
        </div>
      )}
    </div>
  );
}
