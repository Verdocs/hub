<script lang="ts">
export interface VerdocsButtonPanelProps {
  /** Accessible name for the trigger button and its panel. */
  label?: string;
}
</script>

<script setup lang="ts">
import { ref } from 'vue';
import VerdocsPortal from './VerdocsPortal.vue';

const { label = 'Open panel' } = defineProps<VerdocsButtonPanelProps>();

const open = ref(false);
const trigger = ref<HTMLButtonElement | null>(null);
</script>

<template>
  <div class="vdocs:inline-block vdocs:font-sans">
    <button
      ref="trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-label="label"
      class="vdocs:inline-flex vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:opacity-60 vdocs:text-accent-light vdocs:hover:opacity-100 vdocs:[&_svg]:fill-current"
      @click="open = !open"
    >
      <slot name="icon" />
    </button>

    <VerdocsPortal
      v-if="open"
      :anchor="trigger"
      @click-away="open = false"
    >
      <div
        role="dialog"
        :aria-label="label"
        class="vdocs:w-80 vdocs:p-[15px] vdocs:text-sm vdocs:font-bold vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:rounded-ctl vdocs:shadow-lg"
      >
        <slot />
      </div>
    </VerdocsPortal>
  </div>
</template>
