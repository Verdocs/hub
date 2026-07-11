<script lang="ts">
export interface VerdocsTextInputProps {
  /** The label for the field. */
  label?: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  description?: string;
  /** If set, a clear button will be displayed when the field has a value. */
  clearable?: boolean;
  /**
   * If set, a copy-to-clipboard button will be displayed. A field may not be both
   * clearable and copyable; clearable wins if both are set.
   */
  copyable?: boolean;
  /** Only text-like input types are supported by this control. */
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
  /** Marks the input required and adds a marker to the label. */
  required?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, type StyleValue } from 'vue';
import { VerdocsClearIcon, VerdocsCopyIcon, VerdocsEyeIcon, VerdocsEyeSlashIcon } from './icons';
import { showToast } from '../utils/toast';

defineOptions({ inheritAttrs: false });

const { label, description, clearable = false, copyable = false, type = 'text', required = false } = defineProps<VerdocsTextInputProps>();

const emit = defineEmits<{
  /** Fired when focus leaves the input, with the current value. */
  blurred: [value: string];
  /** Fired when the user clicks the clear button. */
  cleared: [];
}>();

const model = defineModel<string>({ default: '' });

const showingPw = ref(false);

// The class and style attributes go to the label wrapper (mirroring the React
// control, where className lands on the label); everything else falls through
// to the input element so placeholder, autocomplete, and disabled work
// natively.
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

const resolvedType = computed(() => (type === 'password' && showingPw.value ? 'text' : type));

const handleClear = () => {
  model.value = '';
  emit('cleared');
};

const copyToClipboard = () => {
  navigator.clipboard
    .writeText(model.value)
    .then(() => showToast('Copied!'))
    .catch(() => showToast('Unable to copy to the clipboard.', { style: 'error' }));
};
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

    <div class="vdocs:relative vdocs:flex vdocs:items-center">
      <input
        v-model="model"
        :type="resolvedType"
        :required="required"
        data-lpignore="true"
        class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
        v-bind="inputAttrs"
        @blur="emit('blurred', model ?? '')"
      >

      <button
        v-if="clearable && !!model"
        type="button"
        aria-label="Clear"
        class="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-edge vdocs:hover:text-muted"
        @click="handleClear"
      >
        <VerdocsClearIcon class="vdocs:size-4" />
      </button>

      <button
        v-if="type === 'password'"
        type="button"
        :aria-label="showingPw ? 'Hide password' : 'Show password'"
        class="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-muted"
        @click="showingPw = !showingPw"
      >
        <VerdocsEyeIcon
          v-if="showingPw"
          class="vdocs:size-5"
        />
        <VerdocsEyeSlashIcon
          v-else
          class="vdocs:size-5"
        />
      </button>

      <button
        v-if="!clearable && copyable && !!model"
        type="button"
        aria-label="Copy to clipboard"
        class="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-muted"
        @click="copyToClipboard"
      >
        <VerdocsCopyIcon class="vdocs:size-4" />
      </button>
    </div>

    <div
      v-if="description"
      class="vdocs:text-xs vdocs:text-muted vdocs:mt-1"
    >
      {{ description }}
    </div>
  </label>
</template>
