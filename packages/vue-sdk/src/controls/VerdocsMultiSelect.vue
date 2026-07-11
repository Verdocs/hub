<script lang="ts">
export interface IMultiSelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value tracked in selectedOptions. */
  value: string;
}

export interface VerdocsMultiSelectProps {
  /** The label for the field. */
  label?: string;
  /** Shown in the trigger when no options are selected. */
  placeholder?: string;
  /** The options to list. */
  options: IMultiSelectOption[];
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import { VerdocsCaretDownIcon } from './icons';

const { label, placeholder = 'Select...', options } = defineProps<VerdocsMultiSelectProps>();

const emit = defineEmits<{
  /** Fired with the new selection when the user toggles an option (the React control's onSelectionChanged). */
  selectionChanged: [selectedOptions: string[]];
}>();

// The values currently selected: the same string[] the React control takes via
// its selectedOptions prop. Bind it with v-model:selected-options.
const selectedOptions = defineModel<string[]>('selectedOptions', { default: () => [] });

const open = ref(false);
const container = ref<HTMLElement | null>(null);
const labelId = useId();

// Chips render from the selection rather than the options list, so values
// without a matching option still show a placeholder chip.
const chips = computed(() => selectedOptions.value.map(value => ({
  value,
  label: options.find(option => option.value === value)?.label || 'Unknown',
})));

const closeOnOutsideClick = (e: MouseEvent) => {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false;
  }
};

const closeOnEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    open.value = false;
  }
};

// The window listeners only exist while the list is open, so an idle picker
// costs nothing and the handlers cannot outlive the component.
watch(open, isOpen => {
  if (isOpen) {
    window.addEventListener('click', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('click', closeOnOutsideClick);
    window.removeEventListener('keydown', closeOnEscape);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('click', closeOnOutsideClick);
  window.removeEventListener('keydown', closeOnEscape);
});

const handleToggleOption = (option: IMultiSelectOption, e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  const next = checked ? [ ...selectedOptions.value, option.value ] : selectedOptions.value.filter(selected => selected !== option.value);
  selectedOptions.value = next;
  emit('selectionChanged', next);
};
</script>

<template>
  <div
    ref="container"
    class="vdocs:block vdocs:w-full vdocs:font-sans vdocs:mb-2.5"
  >
    <div
      v-if="label"
      :id="labelId"
      class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1"
    >
      {{ label }}:
    </div>

    <div class="vdocs:relative">
      <button
        type="button"
        :aria-expanded="open"
        :aria-labelledby="label ? labelId : undefined"
        class="vdocs:relative vdocs:flex vdocs:flex-wrap vdocs:items-center vdocs:gap-1 vdocs:w-full vdocs:min-h-10 vdocs:box-border vdocs:pl-2.5 vdocs:pr-8 vdocs:py-1 vdocs:text-sm vdocs:text-left vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:outline-none vdocs:focus:border-accent"
        @click="open = !open"
      >
        <span
          v-if="chips.length === 0"
          class="vdocs:text-muted"
        >
          {{ placeholder }}
        </span>
        <template v-else>
          <span
            v-for="chip in chips"
            :key="chip.value"
            class="vdocs:inline-block vdocs:px-1.5 vdocs:py-0.5 vdocs:text-xs vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-ctl"
          >
            {{ chip.label }}
          </span>
        </template>
        <VerdocsCaretDownIcon
          :class="[
            'vdocs:absolute vdocs:right-2 vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:size-4.5 vdocs:text-muted',
            open ? 'vdocs:rotate-180' : '',
          ]"
        />
      </button>

      <div
        v-if="open"
        role="group"
        :aria-labelledby="label ? labelId : undefined"
        class="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-52 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1"
      >
        <label
          v-for="option in options"
          :key="option.value"
          class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:px-2 vdocs:py-1.5 vdocs:text-[13px] vdocs:text-ink vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:hover:bg-canvas"
        >
          <input
            type="checkbox"
            :checked="selectedOptions.includes(option.value)"
            class="vdocs:size-4 vdocs:accent-primary vdocs:cursor-pointer"
            @change="handleToggleOption(option, $event)"
          >
          {{ option.label }}
        </label>
      </div>
    </div>
  </div>
</template>
