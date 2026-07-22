<script lang="ts">
import type { IEnvelope, TEnvelopeStatus, VerdocsEndpoint } from '@verdocs/js-sdk';

/**
 * The filtered view to display. "completed" shows envelopes that have been
 * submitted. "action" shows envelopes where the user is a recipient and the
 * envelope is not completed. "waiting" shows envelopes where the user is the
 * sender and the envelope is not completed.
 */
export type TEnvelopesListView = 'all' | 'inbox' | 'sent' | 'completed' | 'action' | 'waiting';

export type TEnvelopesSortBy = 'name' | 'created_at' | 'updated_at' | 'canceled_at' | 'status';

/** Payload for envelope-row events fired by VerdocsEnvelopesList. */
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
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatFullName, userCanCancelEnvelope } from '@verdocs/js-sdk';
import type { IListEnvelopesParams } from '@verdocs/js-sdk';
import VerdocsQuickFilter, { type IFilterOption } from '../../controls/VerdocsQuickFilter.vue';
import VerdocsDropdown, { type IMenuOption } from '../../controls/VerdocsDropdown.vue';
import VerdocsPagination from '../../controls/VerdocsPagination.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsSpinner from '../../controls/VerdocsSpinner.vue';
import VerdocsStatusIndicator from '../envelopes/VerdocsStatusIndicator.vue';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useEnvelopes } from '../../composables/useEnvelopes';
import { useSession } from '../../composables/useSession';
import { SDKError } from '../../types';

const {
  endpoint,
  view: initialView,
  status: initialStatus = 'all',
  sort: initialSort = 'created_at',
  match: initialMatch = '',
  showPagination = true,
  rowsPerPage = 10,
  initialPage = 0,
} = defineProps<VerdocsEnvelopesListProps>();

const emit = defineEmits<{
  /** Fired if an error occurs, with information about the error. React's onSdkError. */
  sdkError: [error: SDKError];
  /**
   * Fired when the user clicks an envelope row, or selects "View Envelope" from the row
   * menu. Typically used to navigate to the envelope detail view. React's onViewEnvelope.
   */
  viewEnvelope: [event: IEnvelopeEvent];
  /** Fired when the user selects "Download" from the row menu. React's onDownload. */
  download: [event: IEnvelopeEvent];
  /** Fired when the user selects "Cancel" from the row menu. React's onCancelEnvelope. */
  cancelEnvelope: [event: IEnvelopeEvent];
  /** Fired when the user changes the view. Useful for saving preferences. React's onChangeView. */
  changeView: [view: TEnvelopesListView];
  /** Fired when the user changes the status filter. Useful for saving preferences. React's onChangeStatus. */
  changeStatus: [status: TEnvelopeStatus | 'all'];
  /** Fired when the user changes the sort order. Useful for saving preferences. React's onChangeSort. */
  changeSort: [sort: TEnvelopesSortBy];
  /**
   * Fired when the user commits a change to the match filter. Fired on blur rather than
   * every keystroke; unlike the other filters, search terms are usually not worth
   * persisting. React's onChangeMatch.
   */
  changeMatch: [match: string];
}>();

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

const resolvedEndpoint = useResolvedEndpoint(endpoint);
const { profile } = useSession(endpoint);

// Each filter starts from its prop and then belongs to the user; later prop
// changes are ignored, mirroring the React list.
const view = ref<TEnvelopesListView | undefined>(initialView);
const status = ref<TEnvelopeStatus | 'all'>(initialStatus);
const sort = ref<TEnvelopesSortBy>(initialSort);
const match = ref(initialMatch);
const localMatch = ref(initialMatch);
const selectedPage = ref(initialPage);

const params = computed<IListEnvelopesParams>(() => {
  const queryParams: IListEnvelopesParams = { page: selectedPage.value, rows: rowsPerPage };
  const currentView = view.value;
  const currentStatus = status.value;

  // The status arrays here mirror the legacy web-sdk exactly. The status filter is only
  // user-adjustable in the "all" view; the named views pin their own statuses so a
  // leftover filter (e.g. Inbox + Declined) can never produce a permanently empty list.
  switch (currentView) {
    case 'all':
      queryParams.status = currentStatus === 'all' ? AllStatuses : [ currentStatus ];
      break;
    case 'inbox':
    case 'sent':
      queryParams.view = currentView;
      break;
    case 'action':
    case 'waiting':
      queryParams.view = currentView;
      queryParams.status = [ 'pending', 'in progress' ];
      break;
    case 'completed':
      queryParams.view = currentView;
      queryParams.status = [ 'complete' ];
      break;
    default:
      queryParams.status = currentStatus === 'all' ? AllStatuses : [ currentStatus ];
  }

  // Sorting is only user-adjustable in the "all" view (and the unset default); the named
  // views use the server's per-view ordering.
  if (currentView === 'all' || currentView === undefined) {
    queryParams.sort_by = sort.value;
  }

  if (match.value.trim() !== '') {
    queryParams.q = match.value.trim();
  }

  return queryParams;
});

const { data, isPending, isFetching, error } = useEnvelopes(params, endpoint);

watch(error, queryError => {
  if (queryError) {
    const details = queryError as { message: string; response?: { status?: number; data?: unknown } };
    emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
  }
});

const envelopes = computed(() => data.value?.envelopes ?? []);
const count = computed(() => data.value?.count ?? 0);

const recipientNames = (envelope: IEnvelope) => (envelope.recipients || []).map(r => formatFullName(r)).join(', ');
const formatUpdated = (envelope: IEnvelope) => new Date(envelope.updated_at).toLocaleString();

const buildMenu = (envelope: IEnvelope): IMenuOption[] => [
  { label: 'View Envelope', id: 'view' },
  { label: 'Download', id: 'download' },
  { label: 'Cancel', id: 'cancel', disabled: !userCanCancelEnvelope(profile.value, envelope) },
];

const handleRowClick = (envelope: IEnvelope) => {
  emit('viewEnvelope', { endpoint: resolvedEndpoint, envelope });
};

const handleMenuSelect = (option: IMenuOption, envelope: IEnvelope) => {
  const event: IEnvelopeEvent = { endpoint: resolvedEndpoint, envelope };
  switch (option.id) {
    case 'view':
      emit('viewEnvelope', event);
      break;
    case 'download':
      emit('download', event);
      break;
    case 'cancel':
      emit('cancelEnvelope', event);
      break;
    default:
      break;
  }
};

const commitMatch = (committed: string) => {
  const trimmed = committed.trim();
  match.value = trimmed;
  localMatch.value = trimmed;
  selectedPage.value = 0;
  emit('changeMatch', trimmed);
};

const handleChangeView = (option: IFilterOption) => {
  view.value = option.value as TEnvelopesListView;
  selectedPage.value = 0;
  emit('changeView', option.value as TEnvelopesListView);
};

const handleChangeStatus = (option: IFilterOption) => {
  status.value = option.value as TEnvelopeStatus | 'all';
  selectedPage.value = 0;
  emit('changeStatus', option.value as TEnvelopeStatus | 'all');
};

const handleChangeSort = (option: IFilterOption) => {
  sort.value = option.value as TEnvelopesSortBy;
  emit('changeSort', option.value as TEnvelopesSortBy);
};
</script>

<template>
  <div class="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink vdocs:text-lg vdocs:max-md:text-sm">
    <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
      <div class="vdocs:w-[300px]">
        <VerdocsTextInput
          v-model="localMatch"
          clearable
          autocomplete="off"
          placeholder="Filter by Name, Recipient, or Field..."
          class="vdocs:mb-0"
          @blurred="commitMatch"
          @cleared="commitMatch('')"
        />
      </div>

      <VerdocsQuickFilter
        label="View"
        :value="view"
        :options="ViewFilters"
        @option-selected="handleChangeView"
      />

      <VerdocsQuickFilter
        v-if="view === 'all'"
        label="Status"
        :value="status"
        :options="StatusFilters"
        @option-selected="handleChangeStatus"
      />

      <VerdocsQuickFilter
        v-if="view === 'all'"
        label="Sort By"
        :value="sort"
        :options="SortFilters"
        @option-selected="handleChangeSort"
      />

      <VerdocsSpinner
        v-if="isFetching && data"
        mode="dark"
        :size="24"
      />
      <div class="vdocs:flex vdocs:flex-1" />
    </div>

    <div v-if="isPending">
      <div
        v-for="placeholder in rowsPerPage"
        :key="placeholder"
        class="vdocs:h-12 vdocs:my-1 vdocs:rounded-row vdocs:bg-canvas vdocs:animate-pulse"
      />
    </div>

    <div
      v-for="envelope in envelopes"
      :key="envelope.id"
      class="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-canvas"
      @click="handleRowClick(envelope)"
    >
      <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
        <span class="vdocs:text-ink vdocs:max-md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            class="vdocs:size-6"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
        </span>

        <div class="vdocs:flex vdocs:flex-1 vdocs:leading-7 vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
          {{ envelope.name }}:&nbsp;
          <span class="vdocs:font-bold vdocs:text-muted vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
            {{ recipientNames(envelope) }}
          </span>
        </div>

        <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden" />
        <VerdocsStatusIndicator
          :envelope="envelope"
          class="vdocs:w-[125px] vdocs:flex-none vdocs:max-md:text-sm"
        />

        <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden" />
        <div class="vdocs:flex vdocs:items-center vdocs:w-[180px] vdocs:flex-none vdocs:whitespace-nowrap vdocs:text-muted vdocs:max-md:hidden">
          {{ formatUpdated(envelope) }}
        </div>

        <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:max-md:hidden" />
        <VerdocsDropdown
          :options="buildMenu(envelope)"
          @option-selected="handleMenuSelect($event, envelope)"
        />
      </div>
    </div>

    <div
      v-if="!isPending && !envelopes.length"
      class="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge"
    >
      No matching envelopes found. Please adjust your filters and try again.
    </div>

    <div
      v-if="!isPending && envelopes.length > 0 && showPagination"
      class="vdocs:mt-5"
    >
      <VerdocsPagination
        :selected-page="selectedPage"
        :per-page="rowsPerPage"
        :item-count="count"
        @select-page="selectedPage = $event"
      />
    </div>
  </div>
</template>
