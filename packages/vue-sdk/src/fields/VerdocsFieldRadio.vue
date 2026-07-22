<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A radio button signing field. Each field is a single button; buttons sharing
 * the same group form an exclusive set. Renders the field's current value from
 * props and reports selection through fieldChange (the React field's
 * onFieldChange callback). Builder affordances (dragging, the settings popover,
 * the group tag) are not ported; see docs/PORTING.md.
 */
export type VerdocsFieldRadioProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect, type ComponentPublicInstance } from 'vue';
import VerdocsRadioButton from '../controls/VerdocsRadioButton.vue';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldRadioProps>();

const emit = defineEmits<{
  /** Fired with this option's id (the field name) when the signer selects it (the React field's onFieldChange). */
  fieldChange: [selectedOptionId: string];
}>();

// The legacy done state inlined these two Material circle glyphs as SVG
// strings. Controls/icons has no radio glyphs yet, so they live here.
const SELECTED_PATH =
  'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 '
  + '0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';
const UNSELECTED_PATH =
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';

// Uncontrolled like the React field's defaultChecked: the field value seeds the
// button once, then selection drives it while hosts persist through fieldChange.
const selected = ref(fieldValue(field) === 'true');

const box = ref<ComponentPublicInstance | null>(null);

// The legacy focusField() imperative method becomes the focused prop: when the
// parent flips it on, move real keyboard focus onto the control's native input.
// The control exposes no focus API, so we reach into its DOM. Post flush so the
// element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    (box.value?.$el as HTMLElement | null)?.querySelector('input')?.focus();
  }
}, { flush: 'post' });

// required and readonly are boolean | null on both field shapes, so coerce
// instead of relying on destructure defaults (those only cover undefined).
const required = computed(() => !!field.required);
const inactive = computed(() => !!field.readonly || disabled);
const ariaLabel = computed(() => field.label || field.name);
const groupName = computed(() => field.group || field.name);

const doneGlyphPath = computed(() => (selected.value ? SELECTED_PATH : UNSELECTED_PATH));

const handleChange = (checked: boolean) => {
  selected.value = checked;
  if (checked) {
    emit('fieldChange', field.name);
  }
};

const wrapperClasses = computed(() => {
  if (done) {
    return 'vdocs-field vdocs:box-border vdocs:block vdocs:size-2.5 vdocs:font-sans vdocs:text-ink';
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:rounded-full vdocs:font-sans',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    required.value && 'vdocs:border vdocs:border-solid vdocs:border-danger',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
  ];
});
</script>

<template>
  <div :class="wrapperClasses">
    <svg
      v-if="done"
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      :aria-label="selected ? 'Selected' : 'Not selected'"
      class="vdocs:size-2.5"
    >
      <path :d="doneGlyphPath" />
    </svg>

    <template v-else>
      <div
        v-if="field.label"
        aria-hidden="true"
        class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs"
      >
        {{ field.label }}
      </div>

      <VerdocsRadioButton
        ref="box"
        :name="groupName"
        :aria-label="ariaLabel"
        :checked="selected"
        :required="required"
        :disabled="inactive"
        @update:checked="handleChange"
      />
    </template>
  </div>
</template>
