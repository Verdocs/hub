<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A multi-line text entry field for signing. The textarea is uncontrolled:
 * field.value (or the template default) seeds it, and hosts persist edits
 * reported through fieldChange (the React field's onFieldChange callback).
 * Set done to render the final value as text.
 */
export type VerdocsFieldTextareaProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldTextareaProps>();

const emit = defineEmits<{
  /** Fired with the full text content after each edit (the React field's onFieldChange). */
  fieldChange: [value: string];
}>();

// The legacy 150x15 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[150px] vdocs:h-[15px] vdocs:font-sans vdocs:text-[11px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

const value = ref(fieldValue(field));
const hasFocus = ref(false);

const inputEl = ref<HTMLTextAreaElement | null>(null);

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

const handleInput = (e: Event) => {
  emit('fieldChange', (e.target as HTMLTextAreaElement).value);
};

const handleFocus = () => {
  hasFocus.value = true;
};

const handleBlur = () => {
  hasFocus.value = false;
};

const wrapperClasses = computed(() => {
  if (done) {
    return `vdocs-field vdocs-field-done ${BOX_CLASSES} vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:text-ink`;
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    BOX_CLASSES,
    'vdocs:border vdocs:border-solid',
    required.value ? 'vdocs-field-required vdocs:border-danger' : 'vdocs:border-ink/20',
    disabled ? 'vdocs-field-disabled' : '',
    // The legacy focused treatment was a ripple animation in the app-level stylesheet.
    // An accent ring gives the same cue without shipping keyframes.
    focused || hasFocus.value ? 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent' : '',
  ];
});

const textareaClasses = computed(() => [
  'vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:resize-none vdocs:border-none vdocs:outline-none vdocs:bg-transparent vdocs:px-[3px] vdocs:py-0 vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink',
  disabled ? 'vdocs:opacity-50' : '',
]);
</script>

<template>
  <div :class="wrapperClasses">
    <template v-if="done">
      {{ value }}
    </template>

    <template v-else>
      <label
        v-if="label"
        :class="LABEL_CLASSES"
      >
        {{ label }}
      </label>

      <textarea
        ref="inputEl"
        v-model="value"
        :name="field.name"
        :aria-label="label || field.name"
        :required="required"
        :placeholder="field.placeholder ?? ''"
        :disabled="inactive"
        :class="textareaClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </template>
  </div>
</template>
