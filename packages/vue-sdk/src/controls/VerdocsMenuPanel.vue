<script lang="ts">
export interface VerdocsMenuPanelProps {
  /** Which side of the screen the panel slides in from. */
  side?: 'left' | 'right';
  /** Whether to dim the rest of the page behind the panel. */
  overlay?: boolean;
  /** The width of the panel in pixels. */
  width?: number;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const { side = 'right', overlay = true, width = 300 } = defineProps<VerdocsMenuPanelProps>();

const emit = defineEmits<{
  /** Fired when the user clicks outside the panel. */
  close: [];
}>();

const panel = ref<HTMLDivElement | null>(null);

const handleDocumentClick = (e: MouseEvent) => {
  if (panel.value && !panel.value.contains(e.target as Node)) {
    emit('close');
  }
};

// Deferring the listener one macrotask keeps the click that mounted the panel
// from closing it again: Vue can flush our mount mid-bubble, so a listener added
// directly in onMounted could still catch that same click. The React port gets
// this ordering for free from effect timing.
let closeTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  closeTimer = setTimeout(() => document.addEventListener('click', handleDocumentClick), 0);
});

onBeforeUnmount(() => {
  clearTimeout(closeTimer);
  document.removeEventListener('click', handleDocumentClick);
});

const panelStyle = computed(() => ({ width: `${width}px` }));

const sideClasses = computed(() =>
  side === 'right'
    ? 'vdocs:right-0 vdocs:starting:translate-x-full'
    : 'vdocs:left-0 vdocs:starting:-translate-x-full');
</script>

<template>
  <Teleport to="body">
    <div
      v-if="overlay"
      aria-hidden="true"
      class="vdocs-menu-panel-overlay vdocs:fixed vdocs:inset-0 vdocs:z-[10000] vdocs:bg-[#0000007f]"
    />
    <div
      ref="panel"
      role="dialog"
      :aria-modal="overlay"
      :style="panelStyle"
      :class="[
        'vdocs-menu-panel vdocs:fixed vdocs:top-0 vdocs:bottom-0 vdocs:z-[10001] vdocs:overflow-y-auto vdocs:bg-surface vdocs:font-sans vdocs:transition vdocs:duration-[350ms] vdocs:translate-x-0 vdocs:opacity-100 vdocs:starting:opacity-0',
        sideClasses,
      ]"
    >
      <slot />
    </div>
  </Teleport>
</template>
