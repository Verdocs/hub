<script lang="ts">
import type { FieldBaseProps } from './types';

/**
 * An attachment field for signing. The legacy component opened an upload dialog;
 * the port goes straight to the platform file picker instead, reporting the chosen
 * File through selectFile (the React field's onSelectFile callback; onDeleteFile
 * is the deleteFile emit). Whether a file is attached derives from field.value
 * (the stored file name), so hosts update the field after handling the upload. The
 * 24px legacy box has no room for a name, so it surfaces as the button tooltip.
 */
export type VerdocsFieldAttachmentProps = FieldBaseProps;
</script>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { VerdocsClearIcon, VerdocsFileCheckIcon, VerdocsPaperclipIcon } from '../controls/icons';
import { fieldValue, signerClassName } from './types';

const { field, disabled = false, done = false, focused = false, signerIndex = 0 } = defineProps<VerdocsFieldAttachmentProps>();

const emit = defineEmits<{
  /** Fired with the chosen file when the signer picks an attachment (the React field's onSelectFile). */
  selectFile: [file: File];
  /** Fired when the signer removes the current attachment (the React field's onDeleteFile). */
  deleteFile: [];
}>();

// The legacy 24x24 default footprint. The page renderer sizes fields to their real
// boxes with inline styles; these defaults only matter when one renders standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-6 vdocs:h-6 vdocs:font-sans vdocs:text-[11px]';

const LABEL_CLASSES =
  'vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]';

const hasFocus = ref(false);

const fileEl = ref<HTMLInputElement | null>(null);
const buttonEl = ref<HTMLButtonElement | null>(null);

// Replaces the legacy focusField() imperative method: the sign flow drives focus
// through the focused prop as it walks the signer from field to field. Post
// flush so the element exists by the time the first run fires.
watchEffect(() => {
  if (focused) {
    buttonEl.value?.focus();
  }
}, { flush: 'post' });

const fileName = computed(() => fieldValue(field));
const hasFile = computed(() => !!fileName.value);
const label = computed(() => field.label ?? '');
// required and readonly are boolean | null on both field shapes, so coerce
// instead of relying on destructure defaults (those only cover undefined).
const required = computed(() => !!field.required);
const inactive = computed(() => disabled || !!field.readonly);
const buttonTitle = computed(() => (hasFile.value ? fileName.value : undefined));

const handlePick = () => {
  // Clearing before the dialog opens means re-picking the same file still fires change.
  if (fileEl.value) {
    fileEl.value.value = '';
    fileEl.value.click();
  }
};

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    emit('selectFile', file);
  }
};

const handleDelete = () => {
  emit('deleteFile');
};

const handleFocus = () => {
  hasFocus.value = true;
};

const handleBlur = () => {
  hasFocus.value = false;
};

const wrapperClasses = computed(() => {
  if (done) {
    return `vdocs-field vdocs-field-done ${BOX_CLASSES}`;
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

const buttonClasses = computed(() => [
  'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6 vdocs:p-0 vdocs:bg-transparent vdocs:outline-none vdocs:cursor-pointer vdocs:disabled:cursor-default',
  required.value ? 'vdocs:border vdocs:border-solid vdocs:border-danger' : 'vdocs:border-none',
  disabled ? 'vdocs:opacity-50' : '',
]);
</script>

<template>
  <div :class="wrapperClasses">
    <div
      v-if="done"
      class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:w-6 vdocs:h-6"
    >
      <VerdocsFileCheckIcon
        v-if="hasFile"
        title="File attached"
        class="vdocs:size-4 vdocs:text-success"
      />
      <VerdocsPaperclipIcon
        v-else
        title="No file attached"
        class="vdocs:size-4 vdocs:text-ink"
      />
    </div>

    <template v-else>
      <label
        v-if="label"
        :class="LABEL_CLASSES"
      >
        {{ label }}
      </label>

      <button
        ref="buttonEl"
        type="button"
        :title="buttonTitle"
        :aria-label="label || field.name"
        :disabled="inactive"
        :class="buttonClasses"
        @click="handlePick"
        @focus="handleFocus"
        @blur="handleBlur"
      >
        <VerdocsFileCheckIcon
          v-if="hasFile"
          class="vdocs:size-4 vdocs:text-success"
        />
        <VerdocsPaperclipIcon
          v-else
          class="vdocs:size-4 vdocs:text-ink"
        />
      </button>

      <button
        v-if="hasFile && !inactive"
        type="button"
        aria-label="Remove attachment"
        class="vdocs:absolute vdocs:-top-1.5 vdocs:-right-1.5 vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-3.5 vdocs:p-0 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-full vdocs:cursor-pointer vdocs:text-muted vdocs:hover:text-ink"
        @click="handleDelete"
      >
        <VerdocsClearIcon class="vdocs:size-2.5" />
      </button>

      <input
        ref="fileEl"
        type="file"
        aria-label="Attach a file"
        :disabled="inactive"
        class="vdocs:sr-only"
        @change="handleFileChange"
      >
    </template>
  </div>
</template>
