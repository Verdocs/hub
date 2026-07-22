<script lang="ts">
/**
 * The initials counterpart to VerdocsSignatureDialog: a thin composition of
 * VerdocsAdoptSignatureDialog in its initials variant, with initials labels
 * and a half-width preview. The adopted PNG comes back through the adopted
 * event as a data URL, with the entered initials in the payload's fullName
 * field. React's onAdopt/onCancel callbacks are the adopted and cancel emits.
 *
 * Purely presentational: persisting the image (createInitials in js-sdk) and
 * writing it to the field are the caller's job, in the adopted handler.
 */
export interface VerdocsInitialDialogProps {
  /** Seeds the Initials input. Displayed uppercased, matching the legacy dialog. */
  initials?: string;
}
</script>

<script setup lang="ts">
import VerdocsAdoptSignatureDialog, { type IAdoptedSignature } from './VerdocsAdoptSignatureDialog.vue';

defineProps<VerdocsInitialDialogProps>();

const emit = defineEmits<{
  /** Fired with the adopted initials image when the user clicks Adopt & Sign. */
  adopted: [adopted: IAdoptedSignature];
  /** Fired when the user cancels or dismisses the dialog. */
  cancel: [];
}>();
</script>

<template>
  <VerdocsAdoptSignatureDialog
    variant="initials"
    :full-name="initials"
    @adopted="emit('adopted', $event)"
    @cancel="emit('cancel')"
  />
</template>
