<script lang="ts">
/** Geometry for a rendered page, reported through the pageRendered event. */
export interface IDocumentPageInfo {
  pageNumber: number;
  virtualWidth: number;
  virtualHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  xScale: number;
  yScale: number;
}

export interface VerdocsEnvelopeDocumentPageProps {
  /**
   * The URI of the page image to display. The caller resolves it, e.g. via
   * `getEnvelopeDocumentPageDisplayUri()` in the JS SDK.
   */
  pageImageUri: string;
  /** The page number being rendered (1-based). Echoed in pageRendered and the image alt text. */
  pageNumber?: number;
  /**
   * The "virtual" width of the page canvas fields are positioned against. Defaults to 612,
   * which at 72dpi is 8.5" wide. Used to compute the x/y scale factors when scaling up/down.
   */
  virtualWidth?: number;
  /**
   * The "virtual" height of the page canvas. Defaults to 792, which at 72dpi is 11" tall.
   * Reserves layout space before the image loads; once it loads, the reported virtual
   * height follows the image's real aspect ratio for non-letter pages.
   */
  virtualHeight?: number;
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const { pageImageUri, pageNumber = 1, virtualWidth = 612, virtualHeight = 792 } = defineProps<VerdocsEnvelopeDocumentPageProps>();

const emit = defineEmits<{
  /**
   * Fired when the page image loads and again whenever the rendered size changes. The
   * geometry includes the x/y scale factors callers need to position overlay children.
   * React's onPageRendered.
   */
  pageRendered: [info: IDocumentPageInfo];
}>();

const container = ref<HTMLDivElement | null>(null);
const naturalSize = ref<{ width: number; height: number } | null>(null);

const notify = () => {
  const el = container.value;
  const natural = naturalSize.value;
  if (!el || !natural?.width || !natural?.height) {
    return;
  }

  // All we really care about from the image is its aspect ratio. Builder places fields
  // against a virtualWidth-wide page, so for non-letter pages the virtual height is
  // derived from the real aspect ratio rather than trusting the 8.5x11 default.
  const aspectRatio = natural.width / natural.height;
  const effectiveVirtualHeight = virtualWidth / aspectRatio;
  const renderedWidth = el.offsetWidth;
  const renderedHeight = renderedWidth / aspectRatio;

  emit('pageRendered', {
    pageNumber,
    virtualWidth,
    virtualHeight: effectiveVirtualHeight,
    renderedWidth,
    renderedHeight,
    naturalWidth: natural.width,
    naturalHeight: natural.height,
    aspectRatio,
    xScale: renderedWidth / virtualWidth,
    yScale: renderedHeight / effectiveVirtualHeight,
  });
};

const handleLoad = (event: Event) => {
  const image = event.target as HTMLImageElement;
  naturalSize.value = { width: image.naturalWidth, height: image.naturalHeight };
  notify();
};

let observer: ResizeObserver | undefined;
let timer = 0;

onMounted(() => {
  // jsdom has no ResizeObserver, and the image load path still notifies there.
  if (!container.value || typeof ResizeObserver === 'undefined') {
    return;
  }

  // Resize streams fire every frame while the user drags, and each notification makes
  // the caller re-place every overlay child, so let the size settle for 100ms first.
  observer = new ResizeObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(notify, 100);
  });
  observer.observe(container.value);
});

onBeforeUnmount(() => {
  window.clearTimeout(timer);
  observer?.disconnect();
});
</script>

<template>
  <div
    ref="container"
    class="vdocs:relative vdocs:w-full"
  >
    <img
      :src="pageImageUri"
      :alt="`Page ${pageNumber}`"
      loading="lazy"
      :style="{ aspectRatio: `auto ${virtualWidth} / ${virtualHeight}` }"
      class="vdocs:block vdocs:h-auto vdocs:w-full vdocs:shadow-[0_0_10px_5px_rgba(0,0,0,0.06)]"
      @load="handleLoad"
    >
    <div class="vdocs:absolute vdocs:inset-0">
      <slot />
    </div>
  </div>
</template>
