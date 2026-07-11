<script lang="ts">
import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';

export interface VerdocsTemplateCreateProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** Maximum combined size of the uploaded documents, in bytes. Defaults to roughly 20MB. */
  maxSize?: number;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { SDKError } from '../../types';
import VerdocsSpinner from '../../controls/VerdocsSpinner.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsFileChooser from '../../controls/VerdocsFileChooser.vue';
import { useCreateTemplate } from '../../composables/useTemplateDetail';

// Matches the legacy web-sdk limit: the API caps creation requests at 20MB, and
// the extra half-megabyte leaves room for the multipart framing around the files.
const DEFAULT_MAX_SIZE = 20.5 * 1024 * 1024;

// maxSize has no props-destructure default because the compiler hoists default
// expressions out of setup, where DEFAULT_MAX_SIZE would not be in scope; the
// fallback lives in a computed instead.
const { endpoint, maxSize } = defineProps<VerdocsTemplateCreateProps>();

const effectiveMaxSize = computed(() => maxSize ?? DEFAULT_MAX_SIZE);

const emit = defineEmits<{
  /** React onCancel: fired when the user clicks Cancel. */
  cancel: [];
  /** React onSdkError: fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
  /** React onTemplateCreated: fired when the template has been created. */
  templateCreated: [template: ITemplate];
}>();

const { mutate: createTemplate, isPending: creating } = useCreateTemplate(endpoint);

const files = ref<File[]>([]);
const name = ref('');
const nameEdited = ref(false);

const totalSize = computed(() => files.value.reduce((total, file) => total + file.size, 0));
const sizeError = computed(() => (totalSize.value > effectiveMaxSize.value ? 'Total file size must not exceed 20MB.' : ''));
const submitDisabled = computed(() => !files.value.length || !name.value.trim() || !!sizeError.value || creating.value);

const handleSelectFiles = (selected: File[]) => {
  files.value = selected;

  // A new selection suggests a template name, but never over a name the user typed.
  const first = selected[0];
  if (!nameEdited.value && first) {
    name.value = first.name;
  }
};

const handleNameInput = (value: string) => {
  name.value = value;
  nameEdited.value = true;
};

const handleSubmit = () => {
  if (submitDisabled.value) {
    return;
  }

  createTemplate(
    { name: name.value.trim(), documents: files.value },
    {
      onSuccess: template => emit('templateCreated', template),
      onError: error => {
        const err = error as Error & { response?: { status?: number; data?: unknown } };
        emit('sdkError', new SDKError(err.message, err.response?.status, err.response?.data));
      },
    },
  );
};
</script>

<template>
  <form
    autocomplete="off"
    class="vdocs:flex vdocs:flex-col vdocs:p-3 vdocs:bg-surface vdocs:font-sans"
    @submit.prevent="handleSubmit"
  >
    <VerdocsTextInput
      required
      label="Name"
      :model-value="name"
      placeholder="Template Name..."
      :disabled="creating"
      @update:model-value="handleNameInput"
    />

    <!-- FileChooser has no disabled prop, so we gate interaction at the wrapper while the upload runs. -->
    <div :class="creating ? 'vdocs:pointer-events-none vdocs:opacity-50' : ''">
      <VerdocsFileChooser
        multiple
        @select-files="handleSelectFiles"
      />
    </div>

    <div
      v-if="!!sizeError"
      class="vdocs:mt-4 vdocs:text-sm vdocs:text-danger"
    >
      {{ sizeError }}
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2 vdocs:mt-4">
      <template v-if="creating">
        <VerdocsSpinner
          mode="dark"
          :size="24"
        />
        <div class="vdocs:text-sm vdocs:text-muted">
          Creating template...
        </div>
      </template>

      <div class="vdocs:flex-1" />

      <VerdocsButton
        size="small"
        label="Cancel"
        variant="outline"
        :disabled="creating"
        @click="emit('cancel')"
      />

      <VerdocsButton
        size="small"
        type="submit"
        label="Create"
        :disabled="submitDisabled"
      />
    </div>
  </form>
</template>
