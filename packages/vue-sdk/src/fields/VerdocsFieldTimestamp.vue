<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A display-only timestamp field. Signers never type into these: the platform stamps
 * them when the document is submitted, so there is no input and nothing to emit. The
 * legacy component previewed the current time in a permanently disabled input; a hint
 * reads clearer, so an unfilled field says what will happen instead of showing a time
 * that is not real yet. Timestamp fields take no input, so the base field props are
 * the entire contract.
 */
export type VerdocsFieldTimestampProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldTimestampProps>();

// The legacy 160x15 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-40 vdocs:h-[15px] vdocs:font-sans vdocs:text-[9px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

const toDisplayTimestamp = (value: string): string => {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const value = computed(() => fieldValue(field));
const label = computed(() => field.label ?? '');
// required is boolean | null on both field shapes, so coerce instead of
// relying on destructure defaults (those only cover undefined).
const required = computed(() => !!field.required);

const display = computed(() => (value.value ? toDisplayTimestamp(value.value) : field.placeholder || 'Filled at signing'));
const doneDisplay = computed(() => (value.value ? toDisplayTimestamp(value.value) : ''));

const wrapperClasses = computed(() => {
  if (done) {
    return `vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:font-medium vdocs:text-ink`;
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    BOX_CLASSES,
    // The legacy scss put the required border on the host for timestamps, not the inner box.
    required.value ? 'vdocs-field-required vdocs:border vdocs:border-solid vdocs:border-danger' : '',
    disabled ? 'vdocs-field-disabled' : '',
    // The legacy focused treatment was a ripple animation in the app-level stylesheet.
    // An accent ring gives the same cue without shipping keyframes.
    focused ? 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent' : '',
  ];
});
</script>

<template>
  <div :class="wrapperClasses">
    <template v-if="done">
      {{ doneDisplay }}
    </template>

    <template v-else>
      <label
        v-if="label"
        :class="LABEL_CLASSES"
      >
        {{ label }}
      </label>

      <!-- The 50% opacity mirrors the legacy pre-completion treatment: the value is
           provisional until the envelope is done, and the field draws full-strength then. -->
      <div class="vdocs:flex vdocs:items-center vdocs:w-full vdocs:h-full vdocs:box-border vdocs:px-0.5 vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:font-medium vdocs:text-ink vdocs:opacity-50">
        {{ display }}
      </div>
    </template>
  </div>
</template>
