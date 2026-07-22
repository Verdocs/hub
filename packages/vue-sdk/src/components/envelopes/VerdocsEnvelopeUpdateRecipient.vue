<script lang="ts">
import type { VerdocsEndpoint } from '@verdocs/js-sdk';

export interface VerdocsEnvelopeUpdateRecipientProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The envelope containing the recipient to update. */
  envelopeId: string;
  /** The role name of the recipient to update. */
  roleName: string;
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { IRecipient, IUpdateRecipientParams } from '@verdocs/js-sdk';
import { useEnvelope, useUpdateRecipient } from '../../composables/useEnvelopes';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsDialog from '../../dialogs/VerdocsDialog.vue';
import { showToast } from '../../utils/toast';
import { SDKError } from '../../types';

const { endpoint, envelopeId, roleName } = defineProps<VerdocsEnvelopeUpdateRecipientProps>();

const emit = defineEmits<{
  /** Fired after the recipient is successfully updated, with the updated recipient. React's onUpdated. */
  updated: [recipient: IRecipient];
  /** Fired when the user dismisses the dialog without saving any changes. React's onCancel. */
  cancel: [];
  /** Fired if an error occurs, with information about the error. React's onSdkError. */
  sdkError: [error: SDKError];
}>();

const toSdkError = (error: unknown) => {
  const e = error as { message: string; response?: { status?: number; data?: unknown } };
  return new SDKError(e.message, e.response?.status, e.response?.data);
};

const { data: envelope, error } = useEnvelope(() => envelopeId, endpoint);
const { mutate: submitUpdate, isPending: saving } = useUpdateRecipient(() => envelopeId, endpoint);

watch(error, queryError => {
  if (queryError) {
    emit('sdkError', toSdkError(queryError));
  }
});

// Edit buffers overlay the loaded recipient: null means untouched, so the form
// tracks the server data until the user starts typing in a field.
const firstName = ref<string | null>(null);
const lastName = ref<string | null>(null);
const email = ref<string | null>(null);
const phone = ref<string | null>(null);
const message = ref<string | null>(null);

const recipient = computed(() => (envelope.value?.recipients ?? []).find(r => r.role_name === roleName));

const handleSave = () => {
  const current = recipient.value;
  if (!current) {
    return;
  }

  const fields: IUpdateRecipientParams = {};
  if (firstName.value !== null && firstName.value !== current.first_name) {
    fields.first_name = firstName.value;
  }
  if (lastName.value !== null && lastName.value !== current.last_name) {
    fields.last_name = lastName.value;
  }
  if (email.value !== null && email.value !== current.email) {
    fields.email = email.value;
  }
  if (phone.value !== null && phone.value !== (current.phone ?? '')) {
    fields.phone = phone.value;
  }
  if (message.value !== null && message.value !== (current.message ?? '')) {
    fields.message = message.value;
  }

  // Nothing changed, so skip the request. The server sends a fresh invite on
  // some updates and we don't want to trigger that for a no-op save.
  if (Object.keys(fields).length < 1) {
    emit('cancel');
    return;
  }

  submitUpdate(
    { roleName, params: fields },
    {
      onSuccess: updated => {
        showToast('Recipient updated', { style: 'success' });
        emit('updated', updated);
      },
      onError: mutationError => {
        showToast(`Error updating recipient: ${(mutationError as Error).message}`, { style: 'error' });
        emit('sdkError', toSdkError(mutationError));
      },
    },
  );
};
</script>

<template>
  <!-- The legacy component rendered nothing until the envelope loaded, to avoid flashing an empty dialog. -->
  <VerdocsDialog
    v-if="recipient"
    heading="Update Recipient"
    @close="emit('cancel')"
  >
    <div class="vdocs:mb-2 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">
      {{ roleName }}
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:gap-3">
      <VerdocsTextInput
        aria-label="First Name"
        placeholder="First Name..."
        class="vdocs:flex-1"
        :model-value="firstName ?? recipient.first_name ?? ''"
        @update:model-value="firstName = $event"
      />
      <VerdocsTextInput
        aria-label="Last Name"
        placeholder="Last Name..."
        class="vdocs:flex-1"
        :model-value="lastName ?? recipient.last_name ?? ''"
        @update:model-value="lastName = $event"
      />
    </div>

    <VerdocsTextInput
      type="email"
      aria-label="Email Address"
      placeholder="Email Address..."
      :model-value="email ?? recipient.email ?? ''"
      @update:model-value="email = $event"
    />

    <VerdocsTextInput
      type="tel"
      aria-label="Phone Number"
      placeholder="Phone Number..."
      :model-value="phone ?? recipient.phone ?? ''"
      @update:model-value="phone = $event"
    />

    <textarea
      rows="3"
      aria-label="Invitation Message"
      placeholder="Optional message to include in invitation..."
      data-lpignore="true"
      :value="message ?? recipient.message ?? ''"
      class="vdocs:box-border vdocs:w-full vdocs:resize-y vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface vdocs:p-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none vdocs:focus:border-accent"
      @input="message = ($event.target as HTMLTextAreaElement).value"
    />

    <div class="vdocs:mt-2 vdocs:text-sm vdocs:italic vdocs:text-muted">
      NOTE: If you change the recipient's email address or invite message, they will receive a
      new invitation to sign the envelope. This will also reset their status if they have previously
      declined to sign.
    </div>

    <template #footer>
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
        <VerdocsButton
          label="Cancel"
          variant="outline"
          size="small"
          :disabled="saving"
          @click="emit('cancel')"
        />
        <VerdocsButton
          label="Save"
          size="small"
          :disabled="saving"
          @click="handleSave"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
