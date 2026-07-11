<script lang="ts">
export interface ITab {
  /** Identifier for the tab. Falls back to the label as the render key. */
  id?: string;
  /** The label to display. */
  label: string;
  /** Disabled tabs render dimmed and cannot be selected. */
  disabled?: boolean;
}

export interface VerdocsTabsProps {
  /** The tabs to display. */
  tabs: ITab[];
}
</script>

<script setup lang="ts">
import { ref, type ComponentPublicInstance } from 'vue';

const { tabs } = defineProps<VerdocsTabsProps>();

const emit = defineEmits<{
  /** Fired when the user selects a tab. */
  selectTab: [tab: ITab, index: number];
}>();

/** The index of the tab to show selected. Bind with v-model:selected-tab. */
const selectedTab = defineModel<number>('selectedTab', { default: 0 });

const tabButtons = ref<(HTMLButtonElement | null)[]>([]);

const setTabButton = (el: Element | ComponentPublicInstance | null, index: number) => {
  tabButtons.value[index] = el as HTMLButtonElement | null;
};

const nextEnabledIndex = (from: number, step: 1 | -1) => {
  const count = tabs.length;

  for (let offset = 1; offset <= count; offset++) {
    const index = ((from + step * offset) % count + count) % count;
    const tab = tabs[index];
    if (tab && !tab.disabled) {
      return index;
    }
  }

  return from;
};

const selectTab = (index: number) => {
  const tab = tabs[index];
  if (!tab || tab.disabled) {
    return;
  }

  // Focus follows selection so the arrow keys keep working from the new tab.
  tabButtons.value[index]?.focus();
  selectedTab.value = index;
  emit('selectTab', tab, index);
};

const handleKeyDown = (e: KeyboardEvent, index: number) => {
  switch (e.key) {
    case 'ArrowRight':
      selectTab(nextEnabledIndex(index, 1));
      break;
    case 'ArrowLeft':
      selectTab(nextEnabledIndex(index, -1));
      break;
    case 'Home':
      selectTab(nextEnabledIndex(-1, 1));
      break;
    case 'End':
      selectTab(nextEnabledIndex(tabs.length, -1));
      break;
    default:
      return;
  }

  e.preventDefault();
};

const tabClasses = (selected: boolean) => [
  'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:px-2.5 vdocs:py-[5px] vdocs:text-sm vdocs:text-ink vdocs:bg-transparent vdocs:cursor-pointer vdocs:border-0 vdocs:border-b-4 vdocs:border-solid vdocs:disabled:text-edge vdocs:disabled:cursor-default',
  selected
    ? 'vdocs:font-medium vdocs:border-accent'
    : 'vdocs:font-normal vdocs:border-transparent',
];
</script>

<template>
  <div
    role="tablist"
    class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:font-sans"
  >
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id ?? tab.label"
      :ref="el => setTabButton(el, index)"
      type="button"
      role="tab"
      :disabled="tab.disabled"
      :aria-selected="index === selectedTab"
      :tabindex="index === selectedTab ? 0 : -1"
      :class="tabClasses(index === selectedTab)"
      @click="selectTab(index)"
      @keydown="handleKeyDown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
