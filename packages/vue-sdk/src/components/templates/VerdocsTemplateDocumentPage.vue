<script lang="ts">
export interface VerdocsTemplateDocumentPageProps {
  /** URL of the server-rendered page image. Omit to render a loading placeholder. */
  pageImageUri?: string;
  /** Page width in PDF points (72dpi). Defaults to 612, US Letter. */
  virtualWidth?: number;
  /** Page height in PDF points (72dpi). Defaults to 792, US Letter. */
  virtualHeight?: number;
  /** The 1-based page number, used for the image alt text. */
  pageNumber?: number;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { pageImageUri, virtualWidth = 612, virtualHeight = 792, pageNumber = 1 } = defineProps<VerdocsTemplateDocumentPageProps>();

const containerRef = ref<HTMLDivElement | null>(null);
const scale = ref(1);

// The legacy component scaled every field individually by the rendered/virtual
// ratio. Here the whole field layer is laid out at the page's virtual size and
// scaled once to the rendered width, which is the same math (the legacy x and y
// scales were always equal) without each child needing to know the scale. The
// pageRendered event existed to re-attach interact.js drag handlers, which are
// not ported (docs/PORTING.md rule 6), so it is gone.
const measure = () => {
  const width = containerRef.value?.offsetWidth ?? 0;
  if (width > 0) {
    scale.value = width / virtualWidth;
  }
};

let observer: ResizeObserver | undefined;

onMounted(() => {
  measure();

  // jsdom has no ResizeObserver; the initial measure above still runs there.
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(containerRef.value!);
  }
});

onBeforeUnmount(() => observer?.disconnect());

// A different page size means a fresh measurement, mirroring the React effect's
// virtualWidth dependency.
watch(() => virtualWidth, measure);

const containerStyle = computed(() => ({ aspectRatio: `${virtualWidth} / ${virtualHeight}` }));

const layerStyle = computed(() => ({
  width: `${virtualWidth}px`,
  height: `${virtualHeight}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}));
</script>

<template>
  <div
    ref="containerRef"
    class="vdocs:relative vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)]"
    :style="containerStyle"
  >
    <img
      v-if="pageImageUri"
      :src="pageImageUri"
      :alt="`Page ${pageNumber}`"
      aria-hidden="true"
      loading="lazy"
      class="vdocs:absolute vdocs:inset-0 vdocs:size-full vdocs:select-none"
    >
    <div
      v-else
      aria-hidden="true"
      data-testid="page-placeholder"
      class="vdocs:absolute vdocs:inset-0 vdocs:bg-canvas vdocs:animate-pulse"
    />

    <!-- Children render into the field layer and position themselves in the page's
         own PDF-point coordinate system: absolute placement, left from the page's
         left edge and bottom up from the page's bottom edge, exactly as field x/y
         are stored. -->
    <div
      class="vdocs:absolute vdocs:top-0 vdocs:left-0"
      :style="layerStyle"
    >
      <slot />
    </div>
  </div>
</template>
