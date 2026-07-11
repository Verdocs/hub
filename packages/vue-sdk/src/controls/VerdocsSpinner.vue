<script lang="ts">
export interface VerdocsSpinnerProps {
  /** Diameter of the spinner in pixels. */
  size?: number;
  /** Light spinners suit dark backgrounds, dark spinners suit light ones. */
  mode?: 'light' | 'dark';
}
</script>

<script setup lang="ts">
const { size = 32, mode = 'light' } = defineProps<VerdocsSpinnerProps>();
</script>

<template>
  <div
    role="status"
    aria-label="Loading"
    :class="[
      'vdocs:animate-spin vdocs:rounded-full vdocs:border-[3px]',
      mode === 'light' ? 'vdocs:border-white/30 vdocs:border-t-white' : 'vdocs:border-ink/30 vdocs:border-t-ink',
    ]"
    :style="{ width: `${size}px`, height: `${size}px`, flex: `0 0 ${size}px` }"
  />
</template>
