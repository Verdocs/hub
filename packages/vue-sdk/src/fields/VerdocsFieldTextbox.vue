<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A single-line text signing field. Renders the field's current value from
 * props and reports edits through fieldChange (the React field's onFieldChange
 * callback). The legacy component switched to a textarea for multiline fields;
 * that mode is VerdocsFieldTextarea's job here. Builder affordances (dragging,
 * resizing, the settings popover) are not ported; see docs/PORTING.md.
 */
export type VerdocsFieldTextboxProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldTextboxProps>();

const emit = defineEmits<{
  /** Fired with the full new text after every keystroke (the React field's onFieldChange). */
  fieldChange: [value: string];
}>();

// Uncontrolled like the React field's defaultValue: the field value seeds the
// input once, then typing drives it while hosts persist through fieldChange.
const value = ref(fieldValue(field));

const inputEl = ref<HTMLInputElement | null>(null);

// The legacy focusField() imperative method becomes the focused prop: when the
// parent flips it on, move real keyboard focus onto the input. Post flush so
// the element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    inputEl.value?.focus();
  }
}, { flush: 'post' });

// required and readonly are boolean | null on both field shapes, so coerce
// instead of relying on destructure defaults (those only cover undefined).
const required = computed(() => !!field.required);
const inactive = computed(() => !!field.readonly || disabled);
const ariaLabel = computed(() => field.label || field.name);
const small = computed(() => (field.height ?? 15) < 15);

// Carried over from the legacy component: the field's pixel width caps how
// many characters fit, at roughly 5px per character.
const maxLength = computed(() => Math.floor((field.width ?? 150) / 5));

const handleInput = (e: Event) => {
  emit('fieldChange', (e.target as HTMLInputElement).value);
};

const wrapperClasses = computed(() => {
  if (done) {
    return 'vdocs-field vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:tracking-[-0.2px] vdocs:text-ink';
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:rounded-ctl vdocs:font-sans vdocs:tracking-[-0.2px]',
    'vdocs:border vdocs:border-solid',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    required.value ? 'vdocs:border-danger' : 'vdocs:border-edge',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
  ];
});

const inputClasses = computed(() => [
  'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full',
  'vdocs:border-none vdocs:outline-none vdocs:bg-transparent',
  'vdocs:py-0 vdocs:px-[3px] vdocs:font-medium vdocs:text-ink',
  'vdocs:disabled:opacity-50',
  small.value ? 'vdocs:text-[8px]' : 'vdocs:text-[11px]',
]);
</script>

<template>
  <div :class="wrapperClasses">
    <template v-if="done">
      {{ value }}
    </template>

    <template v-else>
      <div
        v-if="field.label"
        aria-hidden="true"
        class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs"
      >
        {{ field.label }}
      </div>

      <input
        ref="inputEl"
        v-model="value"
        type="text"
        :name="field.name"
        :aria-label="ariaLabel"
        :maxlength="maxLength"
        :placeholder="field.placeholder ?? ''"
        :required="required"
        :disabled="inactive"
        data-lpignore="true"
        :class="inputClasses"
        @input="handleInput"
      >
    </template>
  </div>
</template>
