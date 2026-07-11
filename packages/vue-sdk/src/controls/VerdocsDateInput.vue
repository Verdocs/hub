<script lang="ts">
export interface VerdocsDateInputProps {
  /** The label for the field. */
  label?: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  description?: string;
  /** Marks the input required and adds a marker to the label. */
  required?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';

defineOptions({ inheritAttrs: false });

const { label, description, required = false } = defineProps<VerdocsDateInputProps>();

// The value is always an ISO yyyy-mm-dd string. The legacy Stencil control
// embedded the air-datepicker widget; the native SDKs lean on the platform
// date picker (input type="date") instead: no dependency, and a stable value
// format.
const model = defineModel<string>({ default: '' });

// The class and style attributes go to the label wrapper (mirroring the React
// control, where className lands on the label); everything else falls through
// to the input element so min, max, and disabled work natively.
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

    <input
      v-model="model"
      type="date"
      :required="required"
      data-lpignore="true"
      class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
      v-bind="inputAttrs"
    >

    <div
      v-if="description"
      class="vdocs:text-xs vdocs:text-muted vdocs:mt-1"
    >
      {{ description }}
    </div>
  </label>
</template>
