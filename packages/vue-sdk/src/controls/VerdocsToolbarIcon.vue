<script lang="ts">
export interface VerdocsToolbarIconProps {
  /** Tooltip text to display on hover/focus. */
  text?: string;
  /** Which side of the icon the tooltip appears on. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** The native button type. Defaults to button so forms only submit via explicit submit buttons. */
  type?: 'button' | 'submit' | 'reset';
}
</script>

<script setup lang="ts">
import { ref, useId } from 'vue';

// Attrs (class, disabled, click handlers) land on the button itself rather
// than the wrapper span, mirroring the React control where the rest props
// spread onto the button.
defineOptions({ inheritAttrs: false });

const { text = '', placement = 'bottom', type = 'button' } = defineProps<VerdocsToolbarIconProps>();

const TOOLTIP_PLACEMENT_CLASSES = {
  top: 'vdocs:bottom-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mb-1.5',
  bottom: 'vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1.5',
  // The wider gap on the left matches the legacy offset used by the floating page menu.
  left: 'vdocs:right-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:mr-5',
  right: 'vdocs:left-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:ml-1.5',
};

const ARROW_PLACEMENT_CLASSES = {
  top: 'vdocs:bottom-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  bottom: 'vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  left: 'vdocs:right-[-4px] vdocs:top-1/2 vdocs:-mt-1',
  right: 'vdocs:left-[-4px] vdocs:top-1/2 vdocs:-mt-1',
};

const tooltipId = useId();
const showing = ref(false);
</script>

<template>
  <span class="vdocs:font-sans vdocs:relative vdocs:inline-flex vdocs:items-center vdocs:justify-center">
    <button
      :type="type"
      :aria-label="text || undefined"
      :aria-describedby="tooltipId"
      class="vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-muted"
      v-bind="$attrs"
      @mouseenter="showing = true"
      @mouseleave="showing = false"
      @focus="showing = true"
      @blur="showing = false"
    >
      <slot />
    </button>

    <span
      v-if="showing && !!text"
      :id="tooltipId"
      role="tooltip"
      :class="[
        'vdocs:absolute vdocs:z-[20000] vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-[13px] vdocs:font-bold vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999]',
        TOOLTIP_PLACEMENT_CLASSES[placement],
      ]"
    >
      {{ text }}
      <span
        :class="[
          'vdocs:absolute vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface',
          ARROW_PLACEMENT_CLASSES[placement],
        ]"
      />
    </span>
  </span>
</template>
