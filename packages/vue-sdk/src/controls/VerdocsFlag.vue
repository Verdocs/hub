<script lang="ts">
export interface VerdocsFlagProps {
  /** The type of flag to display. */
  variant?: 'fill' | 'next';
  /** The text label to display in the flag. */
  label?: string;
  /** If true, shows an "or SKIP" link. */
  showSkip?: boolean;
}
</script>

<script setup lang="ts">
const { variant = 'fill', label = 'FILL', showSkip = false } = defineProps<VerdocsFlagProps>();

const emit = defineEmits<{
  /** Fired when the SKIP link is clicked. Mirrors the React control's onSkip callback. */
  skip: [];
}>();

const VARIANT_CLASSES = {
  // The 14px clip-path values keep the arrow a constant size regardless of the flag's width.
  fill: 'vdocs:w-[110px] vdocs:pl-3.5 vdocs:[clip-path:polygon(0px_50%,14px_0,100%_0,100%_100%,14px_100%)]',
  // No arrow: the width and margin shrink by the 14px the arrow would have occupied.
  next: 'vdocs:w-24 vdocs:ml-3.5',
};

// The flag body typically has its own click handler (focus the field), so a
// skip click must not bubble into it.
const handleSkip = (e: MouseEvent) => {
  e.stopPropagation();
  emit('skip');
};
</script>

<template>
  <div
    :class="[
      'vdocs:absolute vdocs:left-full vdocs:h-6 vdocs:flex vdocs:bg-[#13a10e] vdocs:font-sans vdocs:text-white vdocs:font-semibold vdocs:text-xs vdocs:leading-none vdocs:hover:drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)] vdocs:hover:-translate-x-px',
      VARIANT_CLASSES[variant],
    ]"
  >
    <div class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-full vdocs:gap-1">
      {{ label }}
      <span v-if="showSkip">
        or
        <button
          type="button"
          class="vdocs:font-sans vdocs:text-white vdocs:text-xs vdocs:leading-none vdocs:font-normal vdocs:underline vdocs:hover:no-underline vdocs:cursor-pointer vdocs:bg-transparent vdocs:border-none vdocs:p-0"
          @click="handleSkip"
        >
          SKIP
        </button>
      </span>
    </div>
  </div>
</template>
