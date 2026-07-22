<script lang="ts">
/**
 * A simple check box for UI displays, e.g. dialog boxes. This is distinct from the
 * field checkbox used in signing experiences.
 *
 * Mirrors the React SDK Checkbox. React's controlled checked/onChange pair and its
 * uncontrolled defaultChecked both collapse into the checked model: bind
 * v-model:checked to drive the state, or leave it unbound and the control manages
 * itself. Native input attributes and listeners (name, value, disabled, @change)
 * fall through to the input element.
 */
export interface VerdocsCheckboxProps {
  /** Label displayed to the right of the box. Leave blank for no label. */
  label?: string;
  /** Use 'dark' when rendering on a dark background (lightens the unchecked border). */
  theme?: 'light' | 'dark';
  /** The size of the box. */
  size?: 'normal' | 'small';
}
</script>

<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const { label, theme = 'light', size = 'normal' } = defineProps<VerdocsCheckboxProps>();

/** Two-way checked state. */
const checked = defineModel<boolean>('checked', { default: false });

const SIZE_CLASSES = {
  normal: { box: 'vdocs:size-5', check: 'vdocs:size-3.5' },
  small: { box: 'vdocs:size-4', check: 'vdocs:size-3' },
};

const THEME_CLASSES = {
  light: 'vdocs:border-edge',
  dark: 'vdocs:border-white',
};

// The class and style attributes go to the label wrapper (mirroring the React
// control, where className lands on the label); everything else falls through
// to the input element so name, value, disabled, and native listeners work.
const attrs = useAttrs();
const rootClass = computed(() => attrs.class);
const rootStyle = computed(() => attrs.style as StyleValue | undefined);
const inputAttrs = computed(() => {
  const rest: Record<string, unknown> = {};
  for (const key of Object.keys(attrs)) {
    if (key !== 'class' && key !== 'style') {
      rest[key] = attrs[key];
    }
  }

  return rest;
});
</script>

<template>
  <label
    class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50"
    :class="rootClass"
    :style="rootStyle"
  >
    <!-- The input is the visible box (appearance-none). The check mark has to be a
         following sibling, not a child, for peer-checked to reveal it. -->
    <span class="vdocs:relative vdocs:inline-flex vdocs:shrink-0">
      <input
        v-model="checked"
        type="checkbox"
        :class="[
          'vdocs:peer vdocs:appearance-none vdocs:m-0 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-[2px] vdocs:border-2 vdocs:border-solid vdocs:bg-transparent vdocs:checked:bg-primary vdocs:checked:border-primary vdocs:disabled:cursor-default',
          SIZE_CLASSES[size].box,
          THEME_CLASSES[theme],
        ]"
        v-bind="inputAttrs"
      >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        :class="[
          'vdocs:pointer-events-none vdocs:absolute vdocs:inset-0 vdocs:m-auto vdocs:hidden vdocs:peer-checked:block vdocs:text-white',
          SIZE_CLASSES[size].check,
        ]"
      >
        <path
          d="M3 8.5 6.5 12 13 4.5"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span
      v-if="label"
      class="vdocs:text-sm"
    >
      {{ label }}
    </span>
  </label>
</template>
