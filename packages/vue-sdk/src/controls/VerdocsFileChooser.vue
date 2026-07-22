<script lang="ts">
export interface VerdocsFileChooserProps {
  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF and Word documents. */
  accept?: string;
  /** If set, the user may choose more than one file. */
  multiple?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VerdocsButton from './VerdocsButton.vue';

const {
  accept = 'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  multiple = false,
} = defineProps<VerdocsFileChooserProps>();

const emit = defineEmits<{
  /**
   * Fired when the selection changes (the React control's onSelectFiles). The
   * list is empty when the selection is cleared, e.g. while the user is
   * choosing a different file. Host applications should use this to
   * enable/disable buttons that upload or otherwise process the selection.
   */
  selectFiles: [files: File[]];
}>();

const files = ref<File[]>([]);
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const selectionSummary = computed(() => (files.value.length ? files.value.map(file => file.name).join(', ') : 'Drag a file here'));
const browsePrompt = computed(() => (files.value.length ? '' : 'Or, if you prefer...'));
const browseLabel = computed(() => (files.value.length ? 'Select a different file' : 'Select a file from your computer'));

const applySelection = (selected: File[]) => {
  files.value = selected;
  emit('selectFiles', selected);
};

const handleFilesChanged = (e: Event) => {
  applySelection(Array.from((e.target as HTMLInputElement).files ?? []));
};

const handleBrowse = () => {
  // The selection resets before the dialog opens so hosts can disable their upload buttons
  // while a new pick is pending. Clearing the input's value also means re-picking the same
  // file still fires a change event.
  applySelection([]);
  if (fileInput.value) {
    fileInput.value.value = '';
    fileInput.value.click();
  }
};

const handleDragOver = (e: DragEvent) => {
  // preventDefault marks the box as a valid drop target; without it the browser opens the file.
  e.preventDefault();
  dragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  // dragleave also fires when the cursor moves over child nodes; only clear the highlight
  // when the cursor actually left the box.
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
    dragging.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  dragging.value = false;

  // The accept attribute only filters the browse dialog; browsers don't enforce it on drops.
  // Hosts validate file types when they process the upload anyway.
  const dropped = Array.from(e.dataTransfer?.files ?? []);
  if (dropped.length) {
    applySelection(multiple ? dropped : dropped.slice(0, 1));
  }
};
</script>

<template>
  <div
    :class="[
      'vdocs:flex vdocs:flex-col vdocs:box-border vdocs:font-sans vdocs:text-center vdocs:text-muted vdocs:bg-surface vdocs:rounded-ctl vdocs:px-4 vdocs:py-10',
      dragging ? 'vdocs:outline-2 vdocs:outline-dashed vdocs:outline-accent' : '',
    ]"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      aria-label="Select a file"
      class="vdocs:sr-only"
      @change="handleFilesChanged"
    >

    <div class="vdocs:text-xl vdocs:font-bold vdocs:wrap-anywhere">
      {{ selectionSummary }}
    </div>

    <div class="vdocs:h-5 vdocs:my-5 vdocs:text-base">
      {{ browsePrompt }}
    </div>

    <VerdocsButton
      size="small"
      :label="browseLabel"
      @click="handleBrowse"
    />
  </div>
</template>
