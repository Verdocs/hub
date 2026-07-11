<script lang="ts">
export interface VerdocsToggleButtonProps {
  /**
   * Text to render as the button face when no slot content is given. When an icon
   * fills the slot, this becomes the accessible name only.
   */
  label?: string;
  /** Small buttons suit dialogs and other compact regions. */
  size?: 'small' | 'normal';
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const { label, size = 'normal' } = defineProps<VerdocsToggleButtonProps>();

/**
 * Whether the button renders pressed. Bind with v-model:active, or pass :active
 * plus an update:active handler for the React SDK's controlled shape.
 */
const active = defineModel<boolean>('active', { default: false });

const SIZE_CLASSES = {
  normal: 'vdocs:size-10 vdocs:p-1.5 vdocs:rounded-ctl',
  small: 'vdocs:size-[34px] vdocs:p-1 vdocs:rounded-[2px]',
};

const handleToggle = (e: MouseEvent) => {
  // The legacy control stopped propagation so a toggle never doubles as a click on
  // whatever hosts the button (field toolbars). Keep that contract.
  e.stopPropagation();
  active.value = !active.value;
};

const buttonClasses = computed(() => [
  'vdocs:font-sans vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:cursor-pointer vdocs:[&_svg]:max-w-full vdocs:[&_svg]:max-h-full vdocs:[&_svg]:fill-current',
  SIZE_CLASSES[size],
  active.value
    ? 'vdocs:bg-primary vdocs:text-canvas'
    : 'vdocs:bg-edge-light vdocs:text-ink',
]);
</script>

<template>
  <button
    type="button"
    :aria-pressed="active"
    :aria-label="$slots.default && label ? label : undefined"
    :class="buttonClasses"
    @click="handleToggle"
  >
    <slot>{{ label }}</slot>
  </button>
</template>
