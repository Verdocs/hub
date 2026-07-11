<script lang="ts">
/**
 * A simple radio button for UI displays, e.g. dialog boxes. This is distinct from
 * the field radio button used in signing experiences. Buttons sharing the same
 * name form a group.
 *
 * Mirrors the React SDK RadioButton. React's controlled checked/onChange pair and
 * its uncontrolled defaultChecked both collapse into the checked model
 * (v-model:checked). A radio only reports becoming checked; clearing the previous
 * selection in the group is the consumer's job, exactly as with the React control.
 * Native input attributes and listeners (name, value, disabled, @change) fall
 * through to the input element.
 */
export interface VerdocsRadioButtonProps {
  /** Label displayed to the right of the button. Leave blank for no label. */
  label?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const { label } = defineProps<VerdocsRadioButtonProps>();

/** Two-way checked state. */
const checked = defineModel<boolean>('checked', { default: false });

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

// v-model on a native radio compares the bound value against the element's value
// attribute, which does not fit a boolean checked model, so we sync by hand.
const handleChange = (event: Event) => {
  checked.value = (event.target as HTMLInputElement).checked;
};
</script>

<template>
  <label
    class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50"
    :class="rootClass"
    :style="rootStyle"
  >
    <input
      type="radio"
      :checked="checked"
      class="vdocs:appearance-none vdocs:m-0 vdocs:size-4 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-ink/60 vdocs:bg-canvas vdocs:transition vdocs:duration-200 vdocs:outline-none vdocs:checked:bg-primary vdocs:checked:ring-2 vdocs:checked:ring-inset vdocs:checked:ring-canvas vdocs:focus-visible:border-primary vdocs:disabled:cursor-default vdocs:disabled:bg-canvas vdocs:disabled:border-canvas"
      v-bind="inputAttrs"
      @change="handleChange"
    >
    <span
      v-if="label"
      class="vdocs:text-sm"
    >
      {{ label }}
    </span>
  </label>
</template>
