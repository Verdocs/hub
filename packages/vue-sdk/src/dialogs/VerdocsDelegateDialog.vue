<script lang="ts">
/**
 * Collect the details needed to delegate signing responsibility to someone
 * else. Purely presentational: the sign embed wires the delegate event to the
 * delegation endpoint and closes the dialog when the request completes.
 * React's onDelegate/onCancel callbacks are the delegate and cancel emits; the
 * component takes no props.
 */
export interface IDelegateDetails {
  /** The new recipient's first name. */
  first_name: string;
  /** The new recipient's last name. */
  last_name: string;
  /** The new recipient's email address. The signing invite goes here. */
  email: string;
  /** Optional phone number for SMS invites. */
  phone: string;
  /** Optional message to include in the invite. */
  message: string;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VerdocsTextInput from '../controls/VerdocsTextInput.vue';
import VerdocsButton from '../controls/VerdocsButton.vue';
import VerdocsDialog from './VerdocsDialog.vue';

const emit = defineEmits<{
  /** Fired when the user submits the delegation details. The sign embed wires this to the delegation endpoint. */
  delegate: [details: IDelegateDetails];
  /** Fired when the user cancels via the Cancel button, the close control, or the overlay. */
  cancel: [];
}>();

const details = ref<IDelegateDetails>({ first_name: '', last_name: '', email: '', phone: '', message: '' });

const canDelegate = computed(() => !!details.value.first_name && !!details.value.last_name && !!details.value.email);

// The spread hands the caller a snapshot, not our live reactive object.
const handleDelegate = () => emit('delegate', { ...details.value });
</script>

<template>
  <VerdocsDialog
    heading="Delegate Signing"
    @close="emit('cancel')"
  >
    <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
      New Recipient:
      <span class="vdocs:text-danger">*</span>
    </div>
    <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
      <VerdocsTextInput
        v-model="details.first_name"
        aria-label="First name"
        placeholder="First name"
      />
      <VerdocsTextInput
        v-model="details.last_name"
        aria-label="Last name"
        placeholder="Last name"
      />
    </div>

    <VerdocsTextInput
      v-model="details.email"
      label="Email Address"
      required
      type="email"
      placeholder="New recipient email address"
    />

    <VerdocsTextInput
      v-model="details.phone"
      label="Phone Number"
      type="tel"
      placeholder="Optional phone number"
    />

    <label class="vdocs:block vdocs:font-sans">
      <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
        Message (optional)
      </div>
      <textarea
        v-model="details.message"
        rows="3"
        placeholder="Type message here..."
        class="vdocs:w-full vdocs:px-2.5 vdocs:py-2 vdocs:text-sm vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:resize-y vdocs:focus:border-accent"
      />
    </label>

    <template #footer>
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <VerdocsButton
          label="Cancel"
          variant="outline"
          @click="emit('cancel')"
        />
        <VerdocsButton
          label="Delegate"
          :disabled="!canDelegate"
          @click="handleDelegate"
        />
      </div>
    </template>
  </VerdocsDialog>
</template>
