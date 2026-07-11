<script lang="ts">
export interface VerdocsPortalProps {
  /** The element the floating content is anchored to, typically a template ref. */
  anchor: HTMLElement | null;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { anchor } = defineProps<VerdocsPortalProps>();

const emit = defineEmits<{
  /** Fired when the user clicks outside both the content and the anchor. */
  clickAway: [];
}>();

const content = ref<HTMLDivElement | null>(null);
const position = ref({ top: 0, left: 0 });

// Keeps the wrapper aligned to the anchor: below it and left-aligned when it fits,
// flipped above when it would cross the bottom of the viewport, pulled back from the
// right edge when it would overflow.
const updatePosition = () => {
  const contentEl = content.value;
  if (!anchor || !contentEl) {
    return;
  }

  const anchorRect = anchor.getBoundingClientRect();

  let left = Math.max(anchorRect.left, 0);
  if (left + contentEl.offsetWidth > window.innerWidth) {
    left = Math.max(window.innerWidth - contentEl.offsetWidth - 20, 0);
  }

  let top = anchorRect.bottom;
  if (top + contentEl.offsetHeight > window.innerHeight) {
    top = anchorRect.top - contentEl.offsetHeight;
  }

  if (position.value.top !== top || position.value.left !== left) {
    position.value = { top, left };
  }
};

const positionStyle = computed(() => ({ top: `${position.value.top}px`, left: `${position.value.left}px` }));

const handleDocumentClick = (e: MouseEvent) => {
  const target = e.target as Node;

  // Clicks on the anchor are the caller's own toggle, not a click-away. Clicks
  // inside any portal wrapper are skipped too: floating content can open nested
  // portals whose DOM is a sibling of ours in document.body, not a descendant.
  if (content.value?.contains(target) || anchor?.contains(target)) {
    return;
  }

  if (target instanceof Element && target.closest('.vdocs-portal')) {
    return;
  }

  emit('clickAway');
};

// Vue can flush our mount in a microtask in the middle of the very click that
// opened us, and that click would then land on a listener registered in onMounted
// and read as an immediate click-away. Deferring one macrotask matches the React
// port, where effects subscribe only after the opening event has finished.
let clickAwayTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  updatePosition();
  // The scroll listener is capture-phase so scrolling any ancestor container
  // repositions the content, not just the window.
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
  clickAwayTimer = setTimeout(() => document.addEventListener('click', handleDocumentClick), 0);
});

onBeforeUnmount(() => {
  clearTimeout(clickAwayTimer);
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
  document.removeEventListener('click', handleDocumentClick);
});

// Anchors commonly arrive from a template ref that only fills in after the
// caller mounts, so a change must trigger a fresh measurement.
watch(() => anchor, updatePosition, { flush: 'post' });
</script>

<template>
  <Teleport to="body">
    <div
      ref="content"
      class="vdocs-portal vdocs:fixed vdocs:z-[10001]"
      :style="positionStyle"
    >
      <slot />
    </div>
  </Teleport>
</template>
