<script lang="ts">
export interface VerdocsPaginationProps {
  /** The currently selected page (0-based). */
  selectedPage?: number;
  /** The total number of items. */
  itemCount?: number;
  /** The number of items displayed per page. */
  perPage?: number;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { integerSequence } from '@verdocs/js-sdk';
import { VerdocsChevronDoubleLeftIcon, VerdocsChevronDoubleRightIcon } from './icons';

const VISIBLE_PAGES = 5;

const { selectedPage = 0, itemCount = 0, perPage = 10 } = defineProps<VerdocsPaginationProps>();

const emit = defineEmits<{
  /** Fired when the user selects a page. */
  selectPage: [page: number];
}>();

const numPages = computed(() => (itemCount > 0 ? Math.ceil(itemCount / perPage) : 0));
const firstPage = computed(() => Math.max(0, selectedPage - 2));
const pagesToDisplay = computed(() => integerSequence(0, numPages.value).slice(firstPage.value, firstPage.value + VISIBLE_PAGES));

const pageButtonClasses = (selected: boolean) => [
  'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:text-sm vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:cursor-pointer',
  selected
    ? 'vdocs:bg-accent vdocs:text-white vdocs:border-accent'
    : 'vdocs:bg-surface vdocs:text-ink vdocs:border-edge-light vdocs:hover:border-accent',
];
</script>

<template>
  <nav
    aria-label="Pagination"
    class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:font-sans"
  >
    <button
      v-if="selectedPage > 0"
      type="button"
      aria-label="First page"
      :class="pageButtonClasses(false)"
      @click="emit('selectPage', 0)"
    >
      <VerdocsChevronDoubleLeftIcon class="vdocs:size-4" />
    </button>

    <div
      v-if="firstPage > 0"
      class="vdocs:text-muted vdocs:px-1"
    >
      ...
    </div>

    <button
      v-for="pageNumber in pagesToDisplay"
      :key="pageNumber"
      type="button"
      :aria-label="`Page ${pageNumber + 1}`"
      :aria-current="pageNumber === selectedPage ? 'page' : undefined"
      :class="pageButtonClasses(pageNumber === selectedPage)"
      @click="emit('selectPage', pageNumber)"
    >
      {{ pageNumber + 1 }}
    </button>

    <div
      v-if="selectedPage < numPages - 1"
      class="vdocs:text-muted vdocs:px-1"
    >
      ...
    </div>

    <button
      v-if="selectedPage < numPages - 1"
      type="button"
      aria-label="Last page"
      :class="pageButtonClasses(false)"
      @click="emit('selectPage', numPages - 1)"
    >
      <VerdocsChevronDoubleRightIcon class="vdocs:size-4" />
    </button>
  </nav>
</template>
