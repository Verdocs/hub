<script lang="ts">
/**
 * The e-signature disclosures and consent gate shown before signing begins.
 * Proceed stays disabled until the signer checks the acceptance box; Decline
 * (and Delegate, when enabled) are always available. Purely presentational:
 * the caller records the outcome when an event fires.
 *
 * React's onAgree/onDecline/onDelegate/onCancel callbacks are the agree,
 * decline, delegate, and cancel emits, and its ReactNode disclosures prop is
 * the default slot here, whose fallback is the standard Verdocs disclosures.
 */
export interface VerdocsDisclosureDialogProps {
  /** If true, a Delegate button is included so the recipient can reassign signing. */
  delegator?: boolean;
}
</script>

<script setup lang="ts">
import { ref } from 'vue';
import VerdocsCheckbox from '../controls/VerdocsCheckbox.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import { VerdocsCheckIcon } from '../controls/icons';
import VerdocsDialog from './VerdocsDialog.vue';

const { delegator = false } = defineProps<VerdocsDisclosureDialogProps>();

const emit = defineEmits<{
  /** Fired when the user accepts the disclosures and chooses to proceed. */
  agree: [];
  /** Fired when the user declines to sign. */
  decline: [];
  /** Fired when the user chooses to delegate signing. Only reachable when delegator is true. */
  delegate: [];
  /** Fired when the user dismisses the dialog via the overlay or the close button. */
  cancel: [];
}>();

const accepted = ref(false);
</script>

<template>
  <VerdocsDialog
    heading="e-Signature Disclosures"
    @close="emit('cancel')"
  >
    <slot>
      <!-- Mirrors DEFAULT_DISCLOSURES in js-sdk, which the platform only overrides at the
           organization level. Callers with custom disclosures pass their own content. -->
      <ul class="vdocs:m-0 vdocs:mb-4 vdocs:list-none vdocs:p-0">
        <li class="vdocs:relative vdocs:mb-3 vdocs:pl-[34px] vdocs:text-sm vdocs:leading-5">
          <VerdocsCheckIcon class="vdocs:absolute vdocs:-top-0.5 vdocs:left-0 vdocs:size-6 vdocs:text-muted" />
          Agree to use electronic records and signatures, and confirm you have read the
          <a
            href="https://verdocs.com/en/electronic-record-signature-disclosure/"
            target="_blank"
            rel="noreferrer"
            class="vdocs:text-accent"
          >Electronic Record and Signatures Disclosure</a>.
        </li>
        <li class="vdocs:relative vdocs:mb-3 vdocs:pl-[34px] vdocs:text-sm vdocs:leading-5">
          <VerdocsCheckIcon class="vdocs:absolute vdocs:-top-0.5 vdocs:left-0 vdocs:size-6 vdocs:text-muted" />
          Agree to Verdocs'
          <a
            href="https://verdocs.com/en/eula"
            target="_blank"
            rel="noreferrer"
            class="vdocs:text-accent"
          >End User License Agreement</a>
          and confirm you have read Verdocs'
          <a
            href="https://verdocs.com/en/privacy-policy/"
            target="_blank"
            rel="noreferrer"
            class="vdocs:text-accent"
          >Privacy Policy</a>.
        </li>
      </ul>
    </slot>

    <div class="vdocs:mt-4">
      <VerdocsCheckbox
        v-model:checked="accepted"
        label="I accept the electronic signature disclosures and agree to proceed with digital signing."
      />
    </div>

    <template #footer>
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-3">
        <VerdocsButton
          label="Decline"
          variant="outline"
          class="vdocs:mr-auto"
          @click="emit('decline')"
        />
        <VerdocsButton
          v-if="delegator"
          label="Delegate"
          variant="outline"
          @click="emit('delegate')"
        />
        <VerdocsButton
          label="Proceed"
          :disabled="!accepted"
          @click="emit('agree')"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
