<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A checkbox signing field. Renders the field's current value from props and
 * reports toggles through fieldChange (the React field's onFieldChange
 * callback). Builder affordances (dragging, the settings popover) are not
 * ported; see docs/PORTING.md.
 */
export type VerdocsFieldCheckboxProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect, type ComponentPublicInstance } from 'vue';
import VerdocsCheckbox from '../controls/VerdocsCheckbox.vue';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldCheckboxProps>();

const emit = defineEmits<{
  /** Fired with the new checked state when the signer toggles the box (the React field's onFieldChange). */
  fieldChange: [checked: boolean];
}>();

// Uncontrolled like the React field's defaultChecked: the field value seeds the
// box once, then toggles drive it while hosts persist through fieldChange.
const checked = ref(fieldValue(field) === 'true');

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

const handleChange = (value: boolean) => {
  checked.value = value;
  emit('fieldChange', value);
};

const wrapperClasses = computed(() => {
  if (done) {
    return 'vdocs-field vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans vdocs:text-ink';
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    required.value && 'vdocs:border vdocs:border-solid vdocs:border-danger',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
  ];
});
</script>

<template>
  <div :class="wrapperClasses">
    <!-- The legacy done state printed a check mark or an empty box as text glyphs.
         Sources are ASCII-only, so we draw the two shapes here like the React field. -->
    <svg
      v-if="done"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      :aria-label="checked ? 'Checked' : 'Unchecked'"
      class="vdocs:size-3.5"
    >
      <path
        v-if="checked"
        d="M3 8.5 6.5 12 13 4.5"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect
        v-else
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>

    <template v-else>
      <div
        v-if="field.label"
        aria-hidden="true"
        class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs"
      >
        {{ field.label }}
      </div>

      <VerdocsCheckbox
        ref="box"
        size="small"
        :name="field.name"
        :aria-label="ariaLabel"
        :checked="checked"
        :required="required"
        :disabled="inactive"
        @update:checked="handleChange"
      />
    </template>
  </div>
</template>
