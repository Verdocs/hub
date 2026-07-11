<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * A dropdown signing field that lets the signer choose one of the field's
 * options. Renders the field's current value from props and reports selection
 * through fieldChange (the React field's onFieldChange callback). Builder
 * affordances (dragging, the settings popover) are not ported; see
 * docs/PORTING.md.
 */
export type VerdocsFieldDropdownProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { VerdocsCaretDownIcon } from '../controls/icons';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldDropdownProps>();

const emit = defineEmits<{
  /** Fired with the selected option's id when the signer picks an option (the React field's onFieldChange). */
  fieldChange: [value: string];
}>();

// Uncontrolled like the React field's defaultValue: the field value seeds the
// select once, then picks drive it while hosts persist through fieldChange.
const selected = ref(fieldValue(field));

const selectEl = ref<HTMLSelectElement | null>(null);

// The legacy focusField() imperative method becomes the focused prop: when the
// parent flips it on, move real keyboard focus onto the select. Post flush so
// the element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    selectEl.value?.focus();
  }
}, { flush: 'post' });

// Envelope fields send options: null, and required/readonly are boolean | null,
// so coerce instead of relying on destructure defaults (those only cover
// undefined).
const options = computed(() => field.options ?? []);
const required = computed(() => !!field.required);
const inactive = computed(() => !!field.readonly || disabled);
const ariaLabel = computed(() => field.label || field.name);

const handleChange = (e: Event) => {
  emit('fieldChange', (e.target as HTMLSelectElement).value);
};

const wrapperClasses = computed(() => {
  if (done) {
    return 'vdocs-field vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink';
  }

  return [
    'vdocs-field',
    signerClassName(signerIndex),
    'vdocs:relative vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:rounded-ctl vdocs:font-sans',
    'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
    focused && 'vdocs:ring-2 vdocs:ring-accent',
  ];
});

const selectClasses = computed(() => [
  'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full vdocs:appearance-none vdocs:cursor-pointer',
  'vdocs:py-0 vdocs:pl-1 vdocs:pr-3.5 vdocs:text-[11px] vdocs:font-medium vdocs:text-ink vdocs:bg-transparent',
  'vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:outline-none',
  'vdocs:disabled:opacity-50 vdocs:disabled:cursor-default',
  required.value ? 'vdocs:border-danger' : 'vdocs:border-edge',
]);
</script>

<template>
  <div :class="wrapperClasses">
    <template v-if="done">
      {{ selected }}
    </template>

    <template v-else>
      <div
        v-if="field.label"
        aria-hidden="true"
        class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs"
      >
        {{ field.label }}
      </div>

      <select
        ref="selectEl"
        v-model="selected"
        :name="field.name"
        :aria-label="ariaLabel"
        :required="required"
        :disabled="inactive"
        :class="selectClasses"
        @change="handleChange"
      >
        <option value="">
          Select...
        </option>
        <option
          v-for="option in options"
          :key="option.id"
          :value="option.id"
        >
          {{ option.label }}
        </option>
        <option
          v-if="!options.length"
          value="NA"
        >
          N/A
        </option>
      </select>

      <VerdocsCaretDownIcon class="vdocs:pointer-events-none vdocs:absolute vdocs:top-1/2 vdocs:right-0.5 vdocs:size-3 vdocs:-translate-y-1/2 vdocs:text-ink" />
    </template>
  </div>
</template>
