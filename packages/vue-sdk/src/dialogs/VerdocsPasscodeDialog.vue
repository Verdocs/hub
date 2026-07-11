<script lang="ts">
/**
 * Prompt the signer for the passcode protecting an envelope. Purely
 * presentational: the sign embed wires the submit event to the signer
 * verification endpoint and reports a rejected passcode back through the error
 * prop. React's onSubmit/onCancel callbacks are the submit and cancel emits.
 */
export interface VerdocsPasscodeDialogProps {
  /** Displayed below the input in the danger color, typically after the verification endpoint rejects the passcode. */
  error?: string;
}
</script>

<script setup lang="ts">
import { ref } from 'vue';
import VerdocsTextInput from '../controls/VerdocsTextInput.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsDialog from './VerdocsDialog.vue';

const { error } = defineProps<VerdocsPasscodeDialogProps>();

const emit = defineEmits<{
  /** Fired when the user submits the passcode they entered. The input clears for the next attempt. */
  submit: [code: string];
  /** Fired when the user cancels via the Cancel button or the close control. */
  cancel: [];
}>();

const code = ref('');

const handleSubmit = () => {
  emit('submit', code.value);
  code.value = '';
};
</script>

<template>
  <VerdocsDialog
    heading="Passcode Required"
    persistent
    @close="emit('cancel')"
  >
    <p class="vdocs:mt-0 vdocs:mb-5">
      This document is protected by a passcode. Please enter it below to proceed. If you do not have one, please contact the sender.
    </p>

    <VerdocsTextInput
      v-model="code"
      placeholder="Enter passcode..."
    />

    <div
      v-if="error"
      role="alert"
      class="vdocs:mt-2 vdocs:text-sm vdocs:text-danger"
    >
      {{ error }}
    </div>

    <template #footer>
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <VerdocsButton
          label="Cancel"
          variant="outline"
          @click="emit('cancel')"
        />
        <VerdocsButton
          label="Submit"
          :disabled="!code"
          @click="handleSubmit"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
