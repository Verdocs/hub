<script lang="ts">
/**
 * The dialog the signing flow opens when a recipient reaches a signature field
 * without an adopted signature. A thin composition of
 * VerdocsAdoptSignatureDialog in its signature variant: the user types or
 * draws a signature and the rendered PNG comes back through the adopted event
 * as a data URL. React's onAdopt/onCancel callbacks are the adopted and cancel
 * emits.
 *
 * Purely presentational: persisting the image (createSignature in js-sdk) and
 * writing it to the field are the caller's job, in the adopted handler.
 */
export interface VerdocsSignatureDialogProps {
  /** Seeds the Full Name input, typically the recipient's name. */
  fullName?: string;
}
</script>

<script setup lang="ts">
import VerdocsAdoptSignatureDialog, { type IAdoptedSignature } from './VerdocsAdoptSignatureDialog.vue';

defineProps<VerdocsSignatureDialogProps>();

const emit = defineEmits<{
  /** Fired with the adopted signature image when the user clicks Adopt & Sign. */
  adopted: [adopted: IAdoptedSignature];
  /** Fired when the user cancels or dismisses the dialog. */
  cancel: [];
}>();
</script>

<template>
  <VerdocsAdoptSignatureDialog
    :full-name="fullName"
    @adopted="emit('adopted', $event)"
    @cancel="emit('cancel')"
  />
</template>
