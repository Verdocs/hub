<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A date entry field for signing. The legacy component embedded the air-datepicker
 * widget; like the VerdocsDateInput control, we lean on the platform picker (input
 * type="date") instead: no dependency, and a stable yyyy-mm-dd value format. Native
 * date inputs ignore placeholder text, so the legacy "Date..." placeholder is
 * dropped. Picked dates are reported through fieldChange (the React field's
 * onFieldChange callback).
 */
export type VerdocsFieldDateProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldDateProps>();

const emit = defineEmits<{
  /** Fired with the picked date as an ISO yyyy-mm-dd string, empty when cleared (the React field's onFieldChange). */
  fieldChange: [isoDate: string];
}>();

// The legacy 74x20 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[74px] vdocs:h-5 vdocs:font-sans vdocs:text-[11px] vdocs:tracking-[0.3px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

// Stored values may be date-only strings or full ISO timestamps. The native date input
// only accepts yyyy-mm-dd, so we trim ISO strings and fall back to parsing anything else
// with local date parts (round-tripping through toISOString would shift days across
// timezones).
const toInputDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

// Date-only strings parse as UTC midnight, so calling toLocaleDateString on the parsed
// Date would show the previous day in negative-offset timezones. Building the Date from
// its parts keeps the displayed date the one the signer picked.
const toDisplayDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toInputDate(value));
  if (!match) {
    return value;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString();
};

// Uncontrolled like the React field's defaultValue: the field value seeds the
// input once, then picks drive it while hosts persist through fieldChange.
const current = ref(toInputDate(fieldValue(field)));
const hasFocus = ref(false);

const inputEl = ref<HTMLInputElement | null>(null);

// Replaces the legacy focusField() imperative method: the sign flow drives focus
// through the focused prop as it walks the signer from field to field. Post
// flush so the element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    inputEl.value?.focus();
  }
}, { flush: 'post' });

// required and readonly are boolean | null on both field shapes, so coerce
// instead of relying on destructure defaults (those only cover undefined).
const required = computed(() => !!field.required);
const inactive = computed(() => !!field.readonly || disabled);
const label = computed(() => field.label ?? '');
// The legacy field dropped to a smaller font when the field box was drawn small.
const small = computed(() => (field.width ?? 74) < 74 || (field.height ?? 20) < 20);

const displayDate = computed(() => toDisplayDate(fieldValue(field)));

const handleInput = (e: Event) => {
  emit('fieldChange', (e.target as HTMLInputElement).value);
};

const handleFocus = () => {
  hasFocus.value = true;
};

const handleBlur = () => {
  hasFocus.value = false;
};

const wrapperClasses = computed(() => {
  if (done) {
    return `vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:font-medium vdocs:text-ink`;
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    BOX_CLASSES,
    required.value ? 'vdocs-field-required' : '',
    disabled ? 'vdocs-field-disabled' : '',
    // The legacy focused treatment was a ripple animation in the app-level stylesheet.
    // An accent ring gives the same cue without shipping keyframes.
    focused || hasFocus.value ? 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent' : '',
  ];
});

const inputClasses = computed(() => [
  'vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:appearance-none vdocs:outline-none vdocs:bg-transparent vdocs:font-sans vdocs:font-medium vdocs:text-ink vdocs:border vdocs:border-solid',
  required.value ? 'vdocs:border-danger' : 'vdocs:border-edge-light',
  small.value ? 'vdocs:text-[7px]' : 'vdocs:text-xs',
  disabled ? 'vdocs:opacity-50' : '',
]);
</script>

<template>
  <div :class="wrapperClasses">
    <template v-if="done">
      {{ displayDate }}
    </template>

    <template v-else>
      <label
        v-if="label"
        :class="LABEL_CLASSES"
      >
        {{ label }}
      </label>

      <input
        ref="inputEl"
        v-model="current"
        type="date"
        :name="field.name"
        :aria-label="label || field.name"
        :required="required"
        :disabled="inactive"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      >
    </template>
  </div>
</template>
