<script lang="ts">
import type { TSortTemplateBy, TTemplateVisibilityFilter, VerdocsEndpoint } from '@verdocs/js-sdk';
import { SDKError, type ITemplateEvent } from '../../types';

export type TStarredFilter = 'all' | 'starred' | 'unstarred';

export type TAllowedTemplateAction = 'send' | 'signnow' | 'submitted' | 'link' | 'edit';

/**
 * Props for VerdocsTemplatesList, which displays a list of the templates in
 * the caller's account, with filtering, sorting, and pagination. Row-level
 * actions fire events so the host application can route to its own views.
 */
export interface VerdocsTemplatesListProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The initial visibility setting to filter by. */
  visibility?: TTemplateVisibilityFilter;
  /** The initial starred setting to filter by. */
  starred?: TStarredFilter;
  /** The initial sort order to display. */
  sort?: TSortTemplateBy;
  /** The initial name filter, if any. */
  name?: string;
  /** The row actions to offer in each row's dropdown menu. */
  allowedActions?: TAllowedTemplateAction[];
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
import { canPerformTemplateAction } from '@verdocs/js-sdk';
import type { IGetTemplatesParams, ITemplate } from '@verdocs/js-sdk';
import {
  VerdocsBuildingOfficeIcon,
  VerdocsCalendarCreatedIcon,
  VerdocsCalendarLastUsedIcon,
  VerdocsCalendarUpdatedIcon,
  VerdocsEnvelopeIcon,
  VerdocsGlobeAltIcon,
  VerdocsLockClosedIcon,
} from '../../controls/icons';
import VerdocsQuickFilter, { type IFilterOption } from '../../controls/VerdocsQuickFilter.vue';
import VerdocsDropdown, { type IMenuOption } from '../../controls/VerdocsDropdown.vue';
import VerdocsPagination from '../../controls/VerdocsPagination.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsSpinner from '../../controls/VerdocsSpinner.vue';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useTemplates } from '../../composables/useTemplates';
import { useSession } from '../../composables/useSession';

const {
  endpoint,
  visibility: initialVisibility = 'private_shared',
  starred: initialStarred = 'all',
  sort: initialSort = 'updated_at',
  name: initialName = '',
  allowedActions = ['send', 'signnow', 'submitted', 'link', 'edit'],
  showPagination = true,
  rowsPerPage = 10,
  initialPage = 0,
} = defineProps<VerdocsTemplatesListProps>();

const emit = defineEmits<{
  /** Fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
  /**
   * Fired when the user clicks a template row, or selects "Preview / Send"
   * from the row menu. Typically used to navigate to the template preview.
   */
  viewTemplate: [event: ITemplateEvent];
  /** Fired when the user selects "Submissions" from the row menu. */
  submittedData: [event: ITemplateEvent];
  /** Fired when the user selects "Edit" from the row menu. */
  editTemplate: [event: ITemplateEvent];
  /** Fired when the user changes the sort order. Useful for saving preferences. */
  changeSort: [sort: TSortTemplateBy];
  /** Fired when the user changes the visibility filter. Useful for saving preferences. */
  changeVisibility: [visibility: TTemplateVisibilityFilter];
  /** Fired when the user changes the starred filter. Useful for saving preferences. */
  changeStarred: [starred: TStarredFilter];
  /**
   * Fired when the user commits a change to the name filter. Fired on blur
   * rather than every keystroke; unlike the other filters, search terms are
   * usually not worth persisting.
   */
  changeName: [name: string];
}>();

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

const listEndpoint = useResolvedEndpoint(endpoint);
const { profile } = useSession(endpoint);

// Each filter starts from its prop and then belongs to the user; later prop
// changes are ignored, mirroring the React list.
const visibility = ref<TTemplateVisibilityFilter>(initialVisibility);
const starred = ref<TStarredFilter>(initialStarred);
const sort = ref<TSortTemplateBy>(initialSort);
const name = ref(initialName);
const localNameFilter = ref(initialName);
const selectedPage = ref(initialPage);

const params = computed(() => {
  const queryParams: IGetTemplatesParams = {
    visibility: visibility.value,
    sort_by: sort.value,
    page: selectedPage.value,
    rows: rowsPerPage,
  };

  if (starred.value !== 'all') {
    queryParams.is_starred = starred.value === 'starred';
  }

  if (name.value.trim() !== '') {
    queryParams.q = name.value.trim();
  }

  return queryParams;
});

const { data, isPending, isFetching, error } = useTemplates(params, endpoint);

watch(error, queryError => {
  if (queryError) {
    const details = queryError as { message: string; response?: { status?: number; data?: unknown } };
    emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
  }
});

const templates = computed(() => data.value?.templates ?? []);
const count = computed(() => data.value?.count ?? 0);

// In addition to the server query we also filter locally. This provides a
// faster UI update while typing; the commit on blur re-queries the server
// for any records that newly qualify.
const locallyFilteredTemplates = computed(() => {
  const filter = localNameFilter.value.toLowerCase();
  return filter ? templates.value.filter(t => t.name.toLowerCase().includes(filter)) : templates.value;
});

const dateToShow = computed(() => (sort.value === 'created_at' ? 'created_at' : sort.value === 'updated_at' ? 'updated_at' : 'last_used_at'));

const dateLabel = (template: ITemplate) => {
  const date = template[dateToShow.value];
  return date ? dateFormatter.format(new Date(date)) : 'Never';
};

const handleRowClick = (template: ITemplate) => {
  emit('viewTemplate', { endpoint: listEndpoint, template });
};

const handleMenuSelect = (option: IMenuOption, template: ITemplate) => {
  const event: ITemplateEvent = { endpoint: listEndpoint, template };
  switch (option.id) {
    case 'send':
      emit('viewTemplate', event);
      break;
    case 'submitted':
      emit('submittedData', event);
      break;
    case 'edit':
      emit('editTemplate', event);
      break;
    default:
      break;
  }
};

const buildMenuOptions = (template: ITemplate): IMenuOption[] => {
  const menuOptions: IMenuOption[] = [];
  const canRead = canPerformTemplateAction(profile.value, 'read', template).canPerform;

  if (allowedActions.includes('send')) {
    menuOptions.push({ label: 'Preview / Send', id: 'send', disabled: !canRead });
  }

  if (allowedActions.includes('signnow')) {
    // Not yet available; kept visible so users can discover it is coming.
    menuOptions.push({ label: 'Sign Now', id: 'signnow', disabled: true });
  }

  if (allowedActions.includes('submitted')) {
    menuOptions.push({ label: '' });
    menuOptions.push({ label: 'Submissions', id: 'submitted', disabled: !canRead });
  }

  if (allowedActions.includes('edit')) {
    menuOptions.push({ label: '' });
    menuOptions.push({ label: 'Edit', id: 'edit', disabled: !canPerformTemplateAction(profile.value, 'write', template).canPerform });
  }

  return menuOptions;
};

const commitNameFilter = (committed: string) => {
  const trimmed = committed.trim();
  name.value = trimmed;
  localNameFilter.value = trimmed;
  selectedPage.value = 0;
  emit('changeName', trimmed);
};

const handleChangeVisibility = (option: IFilterOption) => {
  visibility.value = option.value as TTemplateVisibilityFilter;
  selectedPage.value = 0;
  emit('changeVisibility', option.value as TTemplateVisibilityFilter);
};

const handleChangeStarred = (option: IFilterOption) => {
  starred.value = option.value as TStarredFilter;
  selectedPage.value = 0;
  emit('changeStarred', option.value as TStarredFilter);
};

const handleChangeSort = (option: IFilterOption) => {
  sort.value = option.value as TSortTemplateBy;
  emit('changeSort', option.value as TSortTemplateBy);
};
</script>

<template>
  <div class="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink">
    <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
      <div class="vdocs:w-40">
        <VerdocsTextInput
          v-model="localNameFilter"
          clearable
          autocomplete="off"
          placeholder="Filter by Name..."
          class="vdocs:mb-0"
          @blurred="commitNameFilter"
          @cleared="commitNameFilter('')"
        />
      </div>

      <VerdocsQuickFilter
        label="Visibility"
        :value="visibility"
        :options="VisibilityFilters"
        @option-selected="handleChangeVisibility"
      />

      <VerdocsQuickFilter
        label="Starred"
        :value="starred"
        :options="StarredFilters"
        @option-selected="handleChangeStarred"
      />

      <VerdocsQuickFilter
        label="Sort By"
        :value="sort"
        :options="SortOptions"
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
      v-for="template in locallyFilteredTemplates"
      :key="template.id"
      class="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-accent-light/10 vdocs:hover:border-accent-light"
      @click="handleRowClick(template)"
    >
      <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
        <div class="vdocs:flex-1 vdocs:text-base vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
          {{ template.name }}
        </div>

        <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
        <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap">
          <VerdocsEnvelopeIcon
            title="Usage Counter"
            class="vdocs:size-6"
          />
          {{ template.counter || '--' }}
        </div>

        <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
        <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-28">
          <VerdocsCalendarCreatedIcon
            v-if="dateToShow === 'created_at'"
            title="Created"
            class="vdocs:size-6"
          />
          <VerdocsCalendarUpdatedIcon
            v-if="dateToShow === 'updated_at'"
            title="Last Updated"
            class="vdocs:size-6"
          />
          <VerdocsCalendarLastUsedIcon
            v-if="dateToShow === 'last_used_at'"
            title="Last Used"
            class="vdocs:size-6"
          />
          {{ dateLabel(template) }}
        </div>

        <div class="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
        <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-20">
          <template v-if="template.is_public">
            <VerdocsGlobeAltIcon class="vdocs:size-6" />
            Public
          </template>
          <template v-else-if="template.is_personal">
            <VerdocsBuildingOfficeIcon class="vdocs:size-6" />
            Shared
          </template>
          <template v-else>
            <VerdocsLockClosedIcon class="vdocs:size-6" />
            Private
          </template>
        </div>

        <VerdocsDropdown
          :options="buildMenuOptions(template)"
          @option-selected="handleMenuSelect($event, template)"
        />
      </div>
    </div>

    <div
      v-if="!isPending && !templates.length"
      class="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge"
    >
      No matching templates found. Please adjust your filters and try again.
    </div>

    <div
      v-if="!isPending && templates.length > 0 && showPagination"
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
