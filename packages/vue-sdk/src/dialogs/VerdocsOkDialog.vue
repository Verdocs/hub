<script lang="ts">
/**
 * A simple message dialog with an OK button and an optional Cancel button. Purely
 * presentational: the caller renders it conditionally and removes it from the ok
 * and cancel events. Regardless of showCancel, the dialog is always dismissable
 * via the overlay and the close button, both of which fire cancel.
 *
 * React's onOk/onCancel callbacks are the ok and cancel emits. Its ReactNode
 * heading and message props are the heading and message string props here; the
 * heading and default slots replace them for rich content.
 */
export interface VerdocsOkDialogProps {
  /** The title of the dialog. "title" is a reserved word, so we use heading. */
  heading?: string;
  /** The message to display. The default slot replaces it for rich content. */
  message?: string;
  /** Override the OK button's label. */
  buttonLabel?: string;
  /** If set, a Cancel button is also displayed. */
  showCancel?: boolean;
}
</script>

<script setup lang="ts">
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsDialog from './VerdocsDialog.vue';

const { heading, message, buttonLabel = 'OK', showCancel = false } = defineProps<VerdocsOkDialogProps>();

const emit = defineEmits<{
  /** Fired when the user clicks the OK button. */
  ok: [];
  /** Fired when the user clicks Cancel, the close button, or the background overlay. */
  cancel: [];
}>();
</script>

<template>
  <!-- The legacy heading also rendered a document icon, but the base dialog styles hid it
       (the design moved to a plain title plus close button), so we don't port it. -->
  <VerdocsDialog
    :heading="heading"
    @close="emit('cancel')"
  >
    <template
      v-if="$slots.heading"
      #heading
    >
      <slot name="heading" />
    </template>

    <slot>
      {{ message }}
    </slot>

    <template #footer>
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
        <VerdocsButton
          v-if="showCancel"
          label="Cancel"
          variant="outline"
          @click="emit('cancel')"
        />
        <VerdocsButton
          :label="buttonLabel"
          @click="emit('ok')"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
