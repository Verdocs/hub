<script lang="ts">
/**
 * A toggle switch for boolean settings. Wraps a native checkbox input exposed with
 * the switch role, so it participates in forms and assistive tech like any input.
 *
 * Mirrors the React SDK Switch. React's controlled checked/onChange pair and its
 * uncontrolled defaultChecked collapse into the checked model (v-model:checked),
 * and onCheckedChange maps to the model's update:checked event. Native input
 * attributes and listeners still fall through to the input element, so @change
 * delivers the raw event the way onChange does in React.
 */
export interface VerdocsSwitchProps {
  /** Label displayed to the right of the switch. Without one, supply aria-label instead. */
  label?: string;
  /** Select the green (primary) or blue (secondary) treatment. */
  theme?: 'primary' | 'secondary';
}
</script>

<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const { label, theme = 'primary' } = defineProps<VerdocsSwitchProps>();

/** Two-way checked state. */
const checked = defineModel<boolean>('checked', { default: false });

const THEME_CLASSES = {
  primary: 'vdocs:checked:bg-primary',
  secondary: 'vdocs:checked:bg-accent-dark',
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
    class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-not-allowed"
    :class="rootClass"
    :style="rootStyle"
  >
    <!-- The input is the track. The thumb has to be a following sibling, not a
         child, for peer-checked to move it. -->
    <span class="vdocs:relative vdocs:inline-flex vdocs:h-6 vdocs:w-11 vdocs:shrink-0">
      <input
        v-model="checked"
        type="checkbox"
        role="switch"
        :class="[
          'vdocs:peer vdocs:appearance-none vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:size-full vdocs:cursor-pointer vdocs:rounded-full vdocs:bg-edge-light vdocs:transition-colors vdocs:duration-150 vdocs:disabled:cursor-not-allowed vdocs:disabled:bg-disabled',
          THEME_CLASSES[theme],
        ]"
        v-bind="inputAttrs"
      >
      <span class="vdocs:pointer-events-none vdocs:absolute vdocs:top-0.5 vdocs:left-0.5 vdocs:size-5 vdocs:rounded-full vdocs:bg-white vdocs:shadow-lg vdocs:transition-transform vdocs:duration-150 vdocs:peer-checked:translate-x-5" />
    </span>
    <span
      v-if="label"
      class="vdocs:text-sm"
    >
      {{ label }}
    </span>
  </label>
</template>
