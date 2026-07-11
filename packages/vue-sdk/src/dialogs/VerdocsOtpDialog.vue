<script lang="ts">
/**
 * Prompt the signer for the one-time code that was sent to them via email or
 * SMS. Purely presentational: the sign embed sends the initial code when it
 * opens this dialog, wires the submit and resend events to the signer
 * verification endpoint, and reports a rejected code back through the error
 * prop. React's onSubmit/onResend/onCancel callbacks are the submit, resend,
 * and cancel emits.
 */
export interface VerdocsOtpDialogProps {
  /** Displayed below the input in the danger color, typically after the verification endpoint rejects a code. */
  error?: string;
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import VerdocsTextInput from '../controls/VerdocsTextInput.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsDialog from './VerdocsDialog.vue';

const RESEND_COOLDOWN_MS = 30000;

defineProps<VerdocsOtpDialogProps>();

const emit = defineEmits<{
  /** Fired when the user submits the code they entered. The input clears for the next attempt. */
  submit: [code: string];
  /** Fired when the user requests a new code. Locked for 30 seconds after opening, resending, or submitting. */
  resend: [];
  /** Fired when the user cancels via the Cancel button or the close control. */
  cancel: [];
}>();

const code = ref('');
const resendDisabled = ref(true);

// The legacy dialog locked the resend button for 30 seconds at a time to keep signers from
// flooding themselves with codes. The lockout starts on mount (the embed sends the first
// code when it opens this dialog) and restarts after every resend or submit.
let cooldownTimer: ReturnType<typeof setTimeout> | undefined;

const startCooldown = () => {
  resendDisabled.value = true;
  clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(() => {
    resendDisabled.value = false;
  }, RESEND_COOLDOWN_MS);
};

onMounted(startCooldown);
onBeforeUnmount(() => clearTimeout(cooldownTimer));

const handleResend = () => {
  code.value = '';
  startCooldown();
  emit('resend');
};

const handleSubmit = () => {
  emit('submit', code.value);
  code.value = '';
  startCooldown();
};
</script>

<template>
  <VerdocsDialog
    heading="Verification Required"
    persistent
    @close="emit('cancel')"
  >
    <p class="vdocs:mt-0 vdocs:mb-5">
      Please check your messages for a one-time code. If you did not receive it, be sure to check your Spam/Junk folder.
    </p>

    <VerdocsTextInput
      v-model="code"
      placeholder="Enter your one-time code..."
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
          label="Resend"
          :disabled="resendDisabled"
          @click="handleResend"
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
