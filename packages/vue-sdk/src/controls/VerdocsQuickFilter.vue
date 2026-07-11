<script lang="ts">
export interface IFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface VerdocsQuickFilterProps {
  /** The filter options to display. */
  options: IFilterOption[];
  /** Prefix label shown before the selected value. */
  label?: string;
  /** The currently selected value. */
  value?: string;
  /** Shown when no option matches the current value. */
  placeholder?: string;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { VerdocsCaretDownIcon } from './icons';

const { options, label = 'Filter', value = '', placeholder = 'Select...' } = defineProps<VerdocsQuickFilterProps>();

const emit = defineEmits<{
  /** Fired when the user picks an option. */
  optionSelected: [option: IFilterOption];
}>();

const open = ref(false);
const container = ref<HTMLElement | null>(null);

const selectedOption = computed(() => options.find(option => option.value === value));

const closeOnOutsideClick = (e: MouseEvent) => {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false;
  }
};

// The window listener only exists while the menu is open, so an idle filter
// costs nothing and the handler cannot outlive the component.
watch(open, isOpen => {
  if (isOpen) {
    window.addEventListener('click', closeOnOutsideClick);
  } else {
    window.removeEventListener('click', closeOnOutsideClick);
  }
});
onBeforeUnmount(() => window.removeEventListener('click', closeOnOutsideClick));

const handleSelect = (option: IFilterOption) => {
  open.value = false;
  emit('optionSelected', option);
};
</script>

<template>
  <div
    ref="container"
    class="vdocs:relative vdocs:inline-block vdocs:font-sans"
  >
    <button
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:h-8 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:whitespace-nowrap vdocs:hover:border-muted"
      @click="open = !open"
    >
      <span class="vdocs:text-muted">
        {{ label }}:
      </span>
      {{ selectedOption ? selectedOption.label : placeholder }}
      <span class="vdocs:border-l vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:ml-1" />
      <VerdocsCaretDownIcon class="vdocs:size-5 vdocs:text-muted" />
    </button>

    <div
      v-if="open"
      role="listbox"
      class="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:min-w-full vdocs:w-max vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="option"
        :aria-selected="option.value === value"
        :disabled="option.disabled"
        :class="[
          'vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:border-none vdocs:cursor-pointer vdocs:disabled:text-edge vdocs:disabled:cursor-default',
          option.value === value ? 'vdocs:bg-canvas vdocs:text-accent vdocs:font-medium' : 'vdocs:bg-surface vdocs:text-ink vdocs:hover:bg-canvas',
        ]"
        @click="handleSelect(option)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
