<script lang="ts">
/**
 * Display a simple progress bar in a style consistent with the design system.
 *
 * Mirrors the React SDK ProgressBar prop for prop. There are no events or
 * slots; extra attributes fall through to the root element the way className
 * and rest props land on the React control's root.
 */
export interface VerdocsProgressBarProps {
  /** Optional label to display above the bar. */
  label?: string;
  /** If true, the progress percentage will be displayed above the bar. */
  showPercent?: boolean;
  /** The current progress value (0-100). */
  percent?: number;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

const { label = '', showPercent = false, percent = 0 } = defineProps<VerdocsProgressBarProps>();

const widthPercent = computed(() => Math.ceil(Math.min(Math.max(percent, 0), 100)));
</script>

<template>
  <div class="vdocs:font-sans vdocs:w-full vdocs:box-border vdocs:flex vdocs:flex-col">
    <div
      v-if="!!label || showPercent"
      class="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:mb-2"
    >
      <div
        v-if="label"
        class="vdocs:text-sm vdocs:font-semibold vdocs:text-ink"
      >
        {{ label }}
      </div>
      <div
        v-if="showPercent"
        class="vdocs:text-sm vdocs:font-semibold vdocs:text-ink"
      >
        {{ percent }}%
      </div>
    </div>

    <div
      role="progressbar"
      :aria-label="label || 'Progress'"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="widthPercent"
      class="vdocs:flex vdocs:h-2.5 vdocs:rounded-row vdocs:bg-edge-light"
    >
      <div
        class="vdocs:rounded-row vdocs:bg-primary"
        :style="{ width: `${widthPercent}%` }"
      />
    </div>
  </div>
</template>
