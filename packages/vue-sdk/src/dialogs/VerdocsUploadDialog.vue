<script lang="ts">
/**
 * Prompts the user to pick one or more files to attach. Nothing is
 * transmitted: the chosen files are handed to the caller via the upload event,
 * and the caller performs the actual upload and removes the dialog. Purely
 * presentational; render it conditionally like the other dialogs. React's
 * onUpload/onCancel callbacks are the upload and cancel emits.
 */
export interface VerdocsUploadDialogProps {
  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF, Word, and image files. */
  accept?: string;
  /** If set, the user may choose more than one file. */
  multiple?: boolean;
  /** Maximum total size of the selected files, in bytes. Defaults to 20MB. */
  maxSize?: number;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VerdocsFileChooser from '../controls/VerdocsFileChooser.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsDialog from './VerdocsDialog.vue';

const MB = 1024 * 1024;

const {
  accept = '.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*',
  multiple = false,
  maxSize = 20 * 1024 * 1024,
} = defineProps<VerdocsUploadDialogProps>();

const emit = defineEmits<{
  /** Fired with the chosen files when the user clicks Upload. */
  upload: [files: File[]];
  /** Fired when the user clicks Cancel, the close button, or the background overlay. */
  cancel: [];
}>();

const files = ref<File[]>([]);

const totalSize = computed(() => files.value.reduce((acc, file) => acc + file.size, 0));
const tooBig = computed(() => totalSize.value > maxSize);

// The legacy dialog hard-coded "20MB" in this message even when maxSize was customized;
// we derive the label from the actual limit instead.
const limitLabel = computed(() => (maxSize >= MB ? `${Math.round((maxSize / MB) * 10) / 10}MB` : `${Math.round(maxSize / 1024)}KB`));
</script>

<template>
  <VerdocsDialog
    heading="Upload attachment"
    @close="emit('cancel')"
  >
    <!-- The dashed frame preserves the legacy drop-target affordance around the shared picker. -->
    <div class="vdocs:rounded-ctl vdocs:border-2 vdocs:border-dashed vdocs:border-edge">
      <VerdocsFileChooser
        :accept="accept"
        :multiple="multiple"
        @select-files="files = $event"
      />
    </div>

    <div
      v-if="tooBig"
      class="vdocs:mt-4 vdocs:text-sm vdocs:text-danger"
    >
      Total file size must not exceed {{ limitLabel }}.
    </div>

    <template #footer>
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-4">
        <VerdocsButton
          label="Cancel"
          variant="outline"
          @click="emit('cancel')"
        />
        <VerdocsButton
          label="Upload"
          :disabled="tooBig || files.length < 1"
          @click="emit('upload', files)"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
