<script setup lang="ts">
/**
 * Displays a simple help icon. Upon hover or focus, a tooltip will be displayed
 * with help text.
 *
 * Mirrors the React SDK HelpIcon. React's text node prop becomes the default
 * slot, and its icon prop becomes the icon slot, which falls back to the
 * standard help icon. There are no props or events.
 */
import { ref, useId } from 'vue';
import { VerdocsHelpCircleIcon } from './icons';

const tooltipId = useId();
const showing = ref(false);
</script>

<template>
  <span class="vdocs:font-sans vdocs:relative vdocs:inline-block vdocs:opacity-30 vdocs:hover:opacity-100 vdocs:focus-within:opacity-100">
    <span
      role="img"
      aria-label="Help"
      :aria-describedby="tooltipId"
      tabindex="0"
      class="vdocs:inline-block vdocs:text-muted vdocs:outline-none"
      @mouseenter="showing = true"
      @mouseleave="showing = false"
      @focus="showing = true"
      @blur="showing = false"
    >
      <slot name="icon">
        <VerdocsHelpCircleIcon class="vdocs:size-6" />
      </slot>
    </span>

    <span
      v-if="showing"
      :id="tooltipId"
      role="tooltip"
      class="vdocs:absolute vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1 vdocs:z-[10005] vdocs:min-w-[200px] vdocs:max-w-[240px] vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-xs vdocs:font-medium vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999]"
    >
      <slot />
      <span class="vdocs:absolute vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1 vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface" />
    </span>
  </span>
</template>
