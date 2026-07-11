<script lang="ts">
export interface IMenuOption {
  /** The label to display. Options with an empty label render as separators. */
  label: string;
  /** Identifier passed with optionSelected when the option is chosen. */
  id?: string;
  disabled?: boolean;
}

export interface VerdocsDropdownProps {
  /** The menu options to display. */
  options: IMenuOption[];
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { VerdocsMenuArrowIcon } from './icons';

defineProps<VerdocsDropdownProps>();

const emit = defineEmits<{
  /** Fired when the user picks an option. */
  optionSelected: [option: IMenuOption];
}>();

const open = ref(false);
const container = ref<HTMLElement | null>(null);

const closeOnOutsideClick = (e: MouseEvent) => {
  if (container.value && !container.value.contains(e.target as Node)) {
    open.value = false;
  }
};

// The window listener only exists while the menu is open, so idle menus cost
// nothing and the handler cannot outlive the component.
watch(open, isOpen => {
  if (isOpen) {
    window.addEventListener('click', closeOnOutsideClick);
  } else {
    window.removeEventListener('click', closeOnOutsideClick);
  }
});
onBeforeUnmount(() => window.removeEventListener('click', closeOnOutsideClick));

// Menu buttons commonly sit inside clickable rows, so toggling and selecting
// stop propagation to keep row clicks from firing too.
const toggleOpen = (e: MouseEvent) => {
  e.stopPropagation();
  open.value = !open.value;
};

const handleSelect = (e: MouseEvent, option: IMenuOption) => {
  e.stopPropagation();
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
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Open menu"
      class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:rounded-ctl vdocs:cursor-pointer vdocs:text-primary vdocs:hover:bg-canvas"
      @click="toggleOpen"
    >
      <VerdocsMenuArrowIcon class="vdocs:size-6" />
    </button>

    <div
      v-if="open"
      role="menu"
      class="vdocs:absolute vdocs:right-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-40 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1"
    >
      <template
        v-for="(option, index) in options"
        :key="option.id ?? `${option.label}-${index}`"
      >
        <button
          v-if="option.label"
          type="button"
          role="menuitem"
          :disabled="option.disabled"
          class="vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border-none vdocs:cursor-pointer vdocs:hover:bg-canvas vdocs:disabled:text-edge vdocs:disabled:cursor-default vdocs:disabled:bg-surface"
          @click="handleSelect($event, option)"
        >
          {{ option.label }}
        </button>
        <div
          v-else
          class="vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:my-1"
        />
      </template>
    </div>
  </div>
</template>
