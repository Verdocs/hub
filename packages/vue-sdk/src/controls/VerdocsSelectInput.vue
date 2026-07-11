<script lang="ts">
export interface ISelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value reported when the option is selected. */
  value: string;
}

export interface VerdocsSelectInputProps {
  /** The label for the field. */
  label?: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  description?: string;
  /** The options to list. */
  options: ISelectOption[];
  /** Marks the select required and adds a marker to the label. */
  required?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const { label, description, options, required = false } = defineProps<VerdocsSelectInputProps>();

const model = defineModel<string>({ default: '' });

// The class and style attributes go to the label wrapper (mirroring the React
// control, where className lands on the label); everything else falls through
// to the select element so name and disabled work natively.
const attrs = useAttrs();
const rootClass = computed(() => attrs.class);
const rootStyle = computed(() => attrs.style as StyleValue | undefined);
const selectAttrs = computed(() => {
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
    class="vdocs:block vdocs:font-sans vdocs:mb-2.5"
    :class="rootClass"
    :style="rootStyle"
  >
    <div
      v-if="label"
      class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1"
    >
      {{ label }}:
      <span
        v-if="required"
        class="vdocs:text-danger"
      >
        *
      </span>
    </div>

    <select
      v-model="model"
      :required="required"
      class="vdocs:w-full vdocs:h-10 vdocs:px-2 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:cursor-pointer vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted vdocs:disabled:cursor-default"
      v-bind="selectAttrs"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <div
      v-if="description"
      class="vdocs:text-xs vdocs:text-muted vdocs:mt-1"
    >
      {{ description }}
    </div>
  </label>
</template>
