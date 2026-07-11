<script lang="ts">
import type { VerdocsEndpoint } from '@verdocs/js-sdk';

export interface VerdocsTemplateSettingsProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The template ID to edit. */
  templateId: string;
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { SDKError, type ITemplateEvent } from '../../types';
import type { ITemplateCreateParams, TTemplateSender, TTemplateVisibility } from '@verdocs/js-sdk';
import { showToast } from '../../utils/toast';
import VerdocsSwitch from '../../controls/VerdocsSwitch.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsSelectInput from '../../controls/VerdocsSelectInput.vue';
import VerdocsComponentError from '../../controls/VerdocsComponentError.vue';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useTemplate, useUpdateTemplate } from '../../composables/useTemplateDetail';

/**
 * Pending form edits, layered over the server copy of the template. An empty
 * object means the form is clean.
 */
interface ITemplateSettingsEdits {
  name?: string;
  visibility?: TTemplateVisibility;
  sender?: TTemplateSender;
  sendReminders?: boolean;
  initialReminderDays?: number;
  followupReminderDays?: number;
}

const { endpoint, templateId } = defineProps<VerdocsTemplateSettingsProps>();

const emit = defineEmits<{
  /** React onSettingsChanged: fired after the settings are saved, with the updated template. */
  settingsChanged: [event: ITemplateEvent];
  /** React onCancel: fired when the user clicks Cancel. */
  cancel: [];
  /** React onSdkError: fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
}>();

// The server stores reminder delays in milliseconds; the form edits them in days.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const VisibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'public', label: 'Public' },
];

const SenderOptions = [
  { value: 'envelope_creator', label: 'Envelope Creator' },
  { value: 'template_owner', label: 'Template Owner' },
];

const resolvedEndpoint = useResolvedEndpoint(endpoint);
const { data: template, error } = useTemplate(() => templateId, endpoint);
const { mutate: updateTemplate, isPending: saving } = useUpdateTemplate(endpoint);

const edits = ref<ITemplateSettingsEdits>({});
const dirty = computed(() => Object.keys(edits.value).length > 0);

watch(error, queryError => {
  if (queryError) {
    const details = queryError as { message: string; response?: { status?: number; data?: unknown } };
    emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
  }
});

// The template is the source of truth; edits overlay it until they are saved
// (the mutation primes the cache with the server's copy, so clearing the edits
// after a save leaves the form showing exactly what was stored).
const name = computed(() => edits.value.name ?? template.value?.name ?? '');
const visibility = computed(() => edits.value.visibility ?? template.value?.visibility ?? 'private');
const sender = computed(() => edits.value.sender ?? template.value?.sender ?? 'envelope_creator');
const sendReminders = computed(() => edits.value.sendReminders ?? !!template.value?.initial_reminder);
const initialReminderDays = computed(() =>
  edits.value.initialReminderDays ?? (template.value?.initial_reminder ? Math.floor(template.value.initial_reminder / MS_PER_DAY) : 0));
const followupReminderDays = computed(() =>
  edits.value.followupReminderDays ?? (template.value?.followup_reminders ? Math.floor(template.value.followup_reminders / MS_PER_DAY) : 0));

const setEdit = (edit: ITemplateSettingsEdits) => {
  edits.value = { ...edits.value, ...edit };
};

const handleSave = () => {
  // The create/update params type declares the reminder fields as numbers, but
  // the API uses null to disable reminders (and the legacy component sent null),
  // so we cast to keep the wire payload identical.
  const params = {
    name: name.value,
    visibility: visibility.value,
    sender: sender.value,
    initial_reminder: sendReminders.value ? initialReminderDays.value * MS_PER_DAY : null,
    followup_reminders: sendReminders.value ? followupReminderDays.value * MS_PER_DAY : null,
  } as Partial<ITemplateCreateParams>;

  updateTemplate(
    { templateId, params },
    {
      onSuccess: updated => {
        edits.value = {};
        emit('settingsChanged', { endpoint: resolvedEndpoint, template: updated });
      },
      onError: error => {
        const err = error as Error & { response?: { status?: number; data?: { error?: string } } };
        emit('sdkError', new SDKError(err.message, err.response?.status, err.response?.data));
        showToast(err.response?.data?.error || 'Error updating template, please try again later.', { style: 'error' });
      },
    },
  );
};
</script>

<template>
  <VerdocsComponentError
    v-if="error"
    message="Unable to load this template. Please try again later."
  />

  <div
    v-else-if="!template"
    class="vdocs:max-w-[600px] vdocs:p-3"
  >
    <div
      v-for="row in 5"
      :key="row"
      class="vdocs:h-10 vdocs:my-2.5 vdocs:rounded-ctl vdocs:bg-canvas vdocs:animate-pulse"
    />
  </div>

  <form
    v-else
    autocomplete="off"
    class="vdocs:flex vdocs:flex-col vdocs:max-w-[600px] vdocs:p-3 vdocs:bg-canvas vdocs:font-sans vdocs:text-ink"
    @submit.prevent
  >
    <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">
      Settings
    </h5>

    <div class="vdocs:mt-5">
      <VerdocsTextInput
        label="Template Name"
        :model-value="name"
        autocomplete="off"
        placeholder="Template Name..."
        @update:model-value="value => setEdit({ name: value })"
      />
    </div>

    <div class="vdocs:mt-5">
      <VerdocsSelectInput
        label="Visibility"
        :model-value="visibility"
        :options="VisibilityOptions"
        @update:model-value="value => setEdit({ visibility: value as TTemplateVisibility })"
      />
    </div>

    <div class="vdocs:mt-5">
      <VerdocsSelectInput
        label="Owner for envelopes created from this template"
        :model-value="sender"
        :options="SenderOptions"
        @update:model-value="value => setEdit({ sender: value as TTemplateSender })"
      />
    </div>

    <div class="vdocs:mt-5">
      <VerdocsSwitch
        label="Send Reminders"
        :checked="sendReminders"
        @update:checked="value => setEdit({ sendReminders: value })"
      />
    </div>

    <div
      v-if="sendReminders"
      class="vdocs:mt-5"
    >
      <VerdocsTextInput
        label="First Reminder (days)"
        type="number"
        :min="0"
        :model-value="String(initialReminderDays)"
        autocomplete="off"
        placeholder="Delay in days..."
        @update:model-value="value => setEdit({ initialReminderDays: Math.max(0, Math.floor(+value || 0)) })"
      />
    </div>

    <div
      v-if="sendReminders"
      class="vdocs:mt-5"
    >
      <VerdocsTextInput
        label="Follow-up Reminders (days)"
        type="number"
        :min="0"
        :model-value="String(followupReminderDays)"
        autocomplete="off"
        placeholder="Delay in days..."
        @update:model-value="value => setEdit({ followupReminderDays: Math.max(0, Math.floor(+value || 0)) })"
      />
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
      <VerdocsButton
        variant="outline"
        label="Cancel"
        size="small"
        @click="emit('cancel')"
      />
      <VerdocsButton
        label="Save"
        size="small"
        :disabled="!dirty || saving"
        @click="handleSave"
      />
    </div>
  </form>
</template>
