<script lang="ts">
/**
 * Prompts a signer to type a question for the envelope's sender. Purely
 * presentational: the caller renders it conditionally, removes it from the
 * submit and cancel events, and wires submit to whatever actually delivers the
 * question. React's onSubmit/onCancel callbacks are the submit and cancel emits.
 */
export interface VerdocsQuestionDialogProps {
  /** Initial content for the question box, e.g. a draft the user previously typed. */
  question?: string;
}
</script>

<script setup lang="ts">
import { ref } from 'vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsDialog from './VerdocsDialog.vue';

const { question: initialQuestion = '' } = defineProps<VerdocsQuestionDialogProps>();

const emit = defineEmits<{
  /** Fired with the entered text when the user clicks OK. The caller delivers the question to the sender. */
  submit: [question: string];
  /** Fired when the user clicks Cancel, the close button, or the background overlay. */
  cancel: [];
}>();

// The prop only seeds the box; edits after mount belong to the signer.
const question = ref(initialQuestion);
</script>

<template>
  <!-- The legacy heading also rendered a chat-bubble icon, but the base dialog styles hid it
       (the design moved to a plain title plus close button), so we don't port it. -->
  <VerdocsDialog
    heading="Ask the Sender a Question"
    @close="emit('cancel')"
  >
    <textarea
      v-model="question"
      rows="6"
      aria-label="Question"
      placeholder="Enter your question..."
      class="vdocs:w-full vdocs:box-border vdocs:resize-y vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:p-2.5 vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent"
    />

    <template #footer>
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-5">
        <VerdocsButton
          label="Cancel"
          variant="outline"
          class="vdocs:flex-1"
          @click="emit('cancel')"
        />
        <VerdocsButton
          label="OK"
          class="vdocs:flex-1"
          @click="emit('submit', question)"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
