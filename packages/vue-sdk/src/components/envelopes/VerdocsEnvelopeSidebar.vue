<script lang="ts">
import type { IEnvelope, IRecipient, VerdocsEndpoint } from '@verdocs/js-sdk';

/** Payload for the envelopeUpdated event fired by VerdocsEnvelopeSidebar. */
export interface IEnvelopeUpdatedEvent {
  endpoint: VerdocsEndpoint;
  envelope: IEnvelope;
  event: string;
}

/** Payload for recipient-level events fired by VerdocsEnvelopeSidebar. */
export interface IEnvelopeRecipientEvent {
  endpoint: VerdocsEndpoint;
  envelope: IEnvelope;
  recipient: IRecipient;
}

export interface VerdocsEnvelopeSidebarProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The envelope to render. */
  envelopeId: string;
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  capitalize,
  formatFullName,
  getRecipientsWithActions,
  recipientCanAct,
  userIsEnvelopeOwner,
} from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useSession } from '../../composables/useSession';
import {
  useCancelEnvelope,
  useEnvelope,
  useRemindRecipient,
  useResetRecipient,
  useUpdateEnvelope,
} from '../../composables/useEnvelopes';
import VerdocsEnvelopeHistoryIcon, { type THistoryIcon } from './VerdocsEnvelopeHistoryIcon.vue';
import VerdocsEnvelopeUpdateRecipient from './VerdocsEnvelopeUpdateRecipient.vue';
import VerdocsDropdown, { type IMenuOption } from '../../controls/VerdocsDropdown.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsSwitch from '../../controls/VerdocsSwitch.vue';
import VerdocsOkDialog from '../../dialogs/VerdocsOkDialog.vue';
import { showToast } from '../../utils/toast';
import { SDKError } from '../../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const REINVITE_MESSAGE =
  'This will reset the recipient\'s KBA status and send a new signing invitation. If you just want to send a reminder, please click "Send Reminder" instead.';

const { endpoint, envelopeId } = defineProps<VerdocsEnvelopeSidebarProps>();

const emit = defineEmits<{
  /** Fired when the panel is opened or closed, with the new open state. React's onToggle. */
  toggle: [open: boolean];
  /**
   * Fired when the envelope is updated in any way (reminder sent, recipient reset or
   * updated, envelope canceled). May be used for cache invalidation or reporting to
   * other systems. React's onEnvelopeUpdated.
   */
  envelopeUpdated: [event: IEnvelopeUpdatedEvent];
  /**
   * Fired when the user selects Get In-Person Link for a recipient. The host should
   * display its in-person signing link flow for that recipient. React's onGetInPersonLink.
   */
  getInPersonLink: [event: IEnvelopeRecipientEvent];
  /** Fired if an error occurs, with information about the error. React's onSdkError. */
  sdkError: [error: SDKError];
}>();

const toSdkError = (error: unknown) => {
  const e = error as { message: string; response?: { status?: number; data?: unknown } };
  return new SDKError(e.message, e.response?.status, e.response?.data);
};

// Legacy FORMAT_TIMESTAMP was date-fns 'P pp' (short date, time with seconds); the
// next-reminder field used 'P p'. Intl gives us the same localized output.
const timestampFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'medium' });
const reminderFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' });

interface IHistoryEntry {
  icon: THistoryIcon;
  message: string;
  date: Date;
}

function prepareHistoryEntries(envelope: IEnvelope): IHistoryEntry[] {
  const entries: IHistoryEntry[] = [];
  const histories = envelope.history_entries ?? [];

  entries.push({ icon: 'pencil', message: 'Envelope created.', date: new Date(envelope.created_at) });

  if (envelope.status === 'complete') {
    entries.push({ icon: 'pencil', message: 'Envelope completed.', date: new Date(envelope.updated_at) });
  }

  // Older envelopes have no owner:canceled history entry, so we synthesize one
  // from the status to keep the timeline complete.
  const ownerCanceled = histories.some(history => (history.event as string) === 'owner:canceled');
  if (envelope.status === 'canceled' && !ownerCanceled) {
    entries.push({ icon: 'pencil', message: 'Envelope Canceled.', date: new Date(envelope.canceled_at as string) });
  }

  histories.forEach(history => {
    const recipient = (envelope.recipients ?? []).find(r => r.role_name === history.role_name);
    const fullName = formatFullName(recipient);
    const date = new Date(history.created_at);

    switch (history.event.toLowerCase()) {
      case 'recipient:kba_verified':
        entries.push({ icon: 'key', message: `KBA verification completed by ${fullName}.`, date });
        break;
      case 'recipient:kba_failed':
        entries.push({ icon: 'keyslash', message: `KBA verification failed by ${fullName}.`, date });
        break;
      case 'recipient:id_verified':
        entries.push({ icon: 'idcard', message: `ID verification completed by ${fullName}.`, date });
        break;
      case 'recipient:id_failed':
        entries.push({ icon: 'idcardslash', message: `ID verification failed by ${fullName}.`, date });
        break;
      case 'recipient:pin_verified':
        entries.push({ icon: 'pin', message: `PIN verification completed by ${fullName}.`, date });
        break;
      case 'recipient:pin_failed':
        entries.push({ icon: 'pinslash', message: `PIN verification failed by ${fullName}.`, date });
        break;
      case 'recipient:signed':
        entries.push({ icon: 'gesture', message: `Signed by ${fullName}.`, date });
        break;
      case 'recipient:declined':
        entries.push({ icon: 'clear', message: `Declined by ${fullName}.`, date });
        break;
      case 'recipient:opened':
        switch (history.event_detail) {
          case 'email':
          case 'mail':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via email.`, date });
            break;
          case 'sms':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via SMS.`, date });
            break;
          case 'in_person_link':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via In-person link.`, date });
            break;
          case 'in_app':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via dashboard.`, date });
            break;
          default:
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}.`, date });
        }
        break;
      case 'recipient:submitted':
        if (history.event_detail === 'approver') {
          entries.push({ icon: 'check_circle', message: `Approved by ${fullName}.`, date });
        } else {
          entries.push({ icon: 'send', message: `Submitted by ${fullName}.`, date });
        }
        break;
      case 'recipient:prepared':
        entries.push({ icon: 'send', message: `Prepared by ${fullName}.`, date });
        break;
      case 'recipient:claimed':
        if (history.event_detail === 'guest') {
          entries.push({ icon: 'account_circle', message: `${fullName} claimed the Envelope as a guest.`, date });
        } else if (history.event_detail === 'profile') {
          entries.push({ icon: 'verified_user', message: `${fullName} claimed the Envelope as a verified user.`, date });
        }
        break;
      case 'recipient:agreed':
        entries.push({ icon: 'done', message: `${fullName} agreed to use electronic records and signatures.`, date });
        break;
      case 'recipient:invited':
        if (history.event_detail === 'sms') {
          entries.push({ icon: 'textsms', message: `${fullName} has been invited via SMS.`, date });
        } else {
          entries.push({ icon: 'mail', message: `${fullName} has been invited via email.`, date });
        }
        break;
      case 'recipient:reminder':
        if (history.event_detail === 'sms') {
          entries.push({ icon: 'textsms', message: `${fullName} sent a reminder via SMS.`, date });
        } else {
          entries.push({ icon: 'mail', message: `${fullName} sent a reminder via email.`, date });
        }
        break;
      case 'invitation:resent':
        entries.push({
          icon: 'mail',
          message: `Invitation was resent to ${fullName}${history.event_detail === 'reminder' ? ' by reminder' : ''}.`,
          date,
        });
        break;
      case 'envelope:cc':
        entries.push({ icon: 'contact_mail', message: `A copy has been sent to ${fullName}.`, date });
        break;
      case 'recipient:delegated':
        entries.push({ icon: 'people', message: history.event_detail, date });
        break;
      case 'recipient:updated_info':
        entries.push({ icon: 'perm_identity', message: history.event_detail, date });
        break;
      case 'owner:updated_recipient_info':
        entries.push({ icon: 'perm_identity', message: history.event_detail, date });
        break;
      case 'created':
        entries.push({ icon: 'create', message: 'Envelope was created.', date });
        break;
      case 'completed':
        entries.push({ icon: 'done_all', message: 'Envelope was completed.', date });
        break;
      case 'envelope:canceled':
      case 'envelope_canceled':
      case 'canceled':
      case 'owner:canceled':
        entries.push({ icon: 'cancel', message: 'Envelope was canceled by the creator.', date });
        break;
      case 'envelope:expired':
        entries.push({ icon: 'cancel', message: 'Envelope expired.', date });
        break;
      case 'owner:get_in_person_link':
        entries.push({ icon: 'link', message: `Owner accessed the In-person link for ${fullName}.`, date });
        break;
      default:
        // Unknown event types are skipped rather than rendered as raw codes.
        break;
    }
  });

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  return entries;
}

const STATUS_CLASSES: Partial<Record<string, string>> = {
  invited: 'vdocs:bg-[#ff8f00]',
  signed: 'vdocs:bg-success',
  submitted: 'vdocs:bg-success',
  pending: 'vdocs:bg-info',
  canceled: 'vdocs:bg-danger',
  declined: 'vdocs:bg-danger',
};

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'recipients', label: 'Recipients' },
  { id: 'history', label: 'History' },
];

const resolvedEndpoint = useResolvedEndpoint(endpoint);
const { profile } = useSession(endpoint);
const { data: envelope, error } = useEnvelope(() => envelopeId, endpoint);

const { mutate: remind } = useRemindRecipient(() => envelopeId, endpoint);
const { mutate: reset } = useResetRecipient(() => envelopeId, endpoint);
const { mutate: cancel, isPending: canceling } = useCancelEnvelope(() => envelopeId, endpoint);
const { mutate: updateReminders, isPending: updatingReminders } = useUpdateEnvelope(() => envelopeId, endpoint);

const activeTab = ref(0);
const panelOpen = ref(false);
const showCancelDialog = ref(false);
const reinviteRole = ref('');
const updateRole = ref('');

// Edit buffers for the reminder inputs: null means untouched, so the fields
// track the envelope until the user types, and commits happen on blur.
const initialDaysEdit = ref<string | null>(null);
const followupDaysEdit = ref<string | null>(null);

watch(error, queryError => {
  if (queryError) {
    emit('sdkError', toSdkError(queryError));
  }
});

const isOwner = computed(() => !!envelope.value && userIsEnvelopeOwner(profile.value, envelope.value));
const functionsDisabled = computed(() => !!envelope.value && envelope.value.status !== 'pending' && envelope.value.status !== 'in progress');
const recipientsWithActions = computed(() => (envelope.value ? getRecipientsWithActions(envelope.value) : []));
const sortedRecipients = computed(() =>
  [ ...(envelope.value?.recipients ?? []) ].sort((a, b) => (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence)));
const historyEntries = computed(() => (envelope.value ? prepareHistoryEntries(envelope.value) : []));

const remindersEnabled = computed(() => !!envelope.value?.initial_reminder);
const initialDays = computed(() => initialDaysEdit.value ?? String(Math.floor((envelope.value?.initial_reminder ?? 0) / MS_PER_DAY)));
const followupDays = computed(() => followupDaysEdit.value ?? String(Math.floor((envelope.value?.followup_reminders ?? 0) / MS_PER_DAY)));
const nextReminderLabel = computed(() =>
  (envelope.value?.next_reminder ? reminderFormatter.format(new Date(envelope.value.next_reminder)) : 'None'));

const detailFields = computed(() => {
  const e = envelope.value;
  if (!e) {
    return [];
  }

  return [
    { label: 'Envelope ID', value: e.id },
    { label: 'Date Created', value: timestampFormatter.format(new Date(e.created_at)) },
    { label: 'Last Modified', value: timestampFormatter.format(new Date(e.updated_at)) },
    { label: 'Status', value: capitalize(e.status) },
    { label: 'Owner ID', value: e.profile_id },
    { label: 'Owner Name', value: formatFullName(e.profile) },
    { label: 'Owner Email', value: e.profile?.email ?? '' },
  ];
});

const handleSelectTab = (index: number) => {
  const nextOpen = index !== activeTab.value || !panelOpen.value;
  panelOpen.value = nextOpen;
  activeTab.value = index;
  emit('toggle', nextOpen);
};

const canResendRecipient = (recipient: IRecipient) =>
  ![ 'pending', 'declined', 'submitted', 'canceled' ].includes(recipient.status)
  && ![ 'complete', 'declined', 'canceled' ].includes(envelope.value?.status ?? '');

const displayRole = (recipient: IRecipient) => recipient.role_name.replace('delegated_to_', 'Delegated');
const chipClass = (status: string) => STATUS_CLASSES[status] ?? 'vdocs:bg-muted';
const canGetInPersonLink = (recipient: IRecipient) => recipientCanAct(recipient, recipientsWithActions.value);

const recipientMenu = (recipient: IRecipient): IMenuOption[] => [
  { id: 'update', label: 'Update', disabled: recipient.status === 'submitted' },
  { id: 'reminder', label: 'Send Reminder', disabled: !canResendRecipient(recipient) },
  { id: 'inperson', label: 'Get In-Person Link', disabled: !canGetInPersonLink(recipient) },
  { id: 'reinvite', label: 'Re-invite', disabled: !canResendRecipient(recipient) },
];

const doRemind = (roleName: string) => {
  remind(roleName, {
    onSuccess: () => {
      showToast('Reminder Sent', { style: 'success' });
      if (envelope.value) {
        emit('envelopeUpdated', { endpoint: resolvedEndpoint, envelope: envelope.value, event: 'reminder' });
      }
    },
    onError: mutationError => showToast(`Error sending reminder: ${(mutationError as Error).message}`, { style: 'error' }),
  });
};

const doReset = (roleName: string) => {
  reset(roleName, {
    onSuccess: () => {
      showToast('Recipient Reset', { style: 'success' });
      if (envelope.value) {
        emit('envelopeUpdated', { endpoint: resolvedEndpoint, envelope: envelope.value, event: 'reinvite' });
      }
    },
    onError: mutationError => showToast(`Error resetting recipient: ${(mutationError as Error).message}`, { style: 'error' }),
  });
};

const handleRecipientAction = (recipient: IRecipient, option: IMenuOption) => {
  switch (option.id) {
    case 'update':
      updateRole.value = recipient.role_name;
      break;
    case 'reminder':
      doRemind(recipient.role_name);
      break;
    case 'reinvite':
      reinviteRole.value = recipient.role_name;
      break;
    case 'inperson':
      if (envelope.value) {
        emit('getInPersonLink', { endpoint: resolvedEndpoint, envelope: envelope.value, recipient });
      }
      break;
    default:
      break;
  }
};

const clearReminderEdits = () => {
  initialDaysEdit.value = null;
  followupDaysEdit.value = null;
};

const reminderCallbacks = {
  onSuccess: clearReminderEdits,
  onError: (mutationError: unknown) => {
    clearReminderEdits();
    showToast(`Error updating reminders: ${(mutationError as Error).message}`, { style: 'error' });
  },
};

const handleToggleReminders = () => {
  if (remindersEnabled.value) {
    updateReminders({ initial_reminder: null, followup_reminders: null }, reminderCallbacks);
  } else {
    updateReminders({ initial_reminder: MS_PER_DAY, followup_reminders: 3 * MS_PER_DAY }, reminderCallbacks);
  }
};

const handleCommitReminders = () => {
  // Blur fires whether or not the user typed anything; only commit edits.
  if (initialDaysEdit.value === null && followupDaysEdit.value === null) {
    return;
  }

  updateReminders(
    { initial_reminder: Number(initialDays.value) * MS_PER_DAY, followup_reminders: Number(followupDays.value) * MS_PER_DAY },
    reminderCallbacks,
  );
};

const confirmCancel = () => {
  showCancelDialog.value = false;
  cancel(undefined, {
    onSuccess: () => {
      showToast('Envelope canceled', { style: 'success' });
      panelOpen.value = false;
      if (envelope.value) {
        emit('envelopeUpdated', { endpoint: resolvedEndpoint, envelope: { ...envelope.value, status: 'canceled' }, event: 'canceled' });
      }
    },
    onError: mutationError => showToast(`Error canceling envelope: ${(mutationError as Error).message}`, { style: 'error' }),
  });
};

const confirmReinvite = () => {
  const role = reinviteRole.value;
  reinviteRole.value = '';
  doReset(role);
};

const onRecipientUpdated = () => {
  updateRole.value = '';
  if (envelope.value) {
    emit('envelopeUpdated', { endpoint: resolvedEndpoint, envelope: envelope.value, event: 'update' });
  }
};
</script>

<template>
  <div
    :class="[
      'vdocs:box-border vdocs:flex vdocs:h-full vdocs:min-h-[400px] vdocs:flex-row vdocs:overflow-hidden vdocs:bg-[#41435e] vdocs:font-sans vdocs:transition-[width] vdocs:duration-500',
      panelOpen ? 'vdocs:w-[400px] vdocs:max-[500px]:w-[300px]' : 'vdocs:w-14',
    ]"
  >
    <div
      role="tablist"
      aria-orientation="vertical"
      class="vdocs:flex vdocs:w-14 vdocs:shrink-0 vdocs:flex-col"
    >
      <button
        v-for="(tab, index) in TABS"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-label="tab.label"
        :aria-selected="panelOpen && activeTab === index"
        :class="[
          'vdocs:flex vdocs:h-[50px] vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:border-0 vdocs:border-l-2 vdocs:border-solid vdocs:bg-transparent vdocs:p-0 vdocs:text-white',
          activeTab === index && panelOpen ? 'vdocs:border-primary' : 'vdocs:border-transparent',
        ]"
        @click="handleSelectTab(index)"
      >
        <svg
          v-if="tab.id === 'details'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="vdocs:size-6"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <svg
          v-else-if="tab.id === 'recipients'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="vdocs:size-6"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="vdocs:size-6"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </button>
    </div>

    <div
      v-if="panelOpen"
      role="tabpanel"
      class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col vdocs:overflow-y-auto vdocs:px-4 vdocs:pt-3 vdocs:pb-4 vdocs:text-white"
    >
      <div
        v-if="!envelope"
        class="vdocs:text-sm"
      >
        Unable to load envelope. Please try again later.
      </div>

      <template v-if="envelope && activeTab === 0">
        <div class="vdocs:mb-3 vdocs:truncate vdocs:text-base">
          Details
        </div>
        <template
          v-for="field in detailFields"
          :key="field.label"
        >
          <div class="vdocs:truncate vdocs:text-xs vdocs:text-white/55">
            {{ field.label }}
          </div>
          <div class="vdocs:mb-3.5 vdocs:truncate vdocs:text-sm vdocs:font-medium">
            {{ field.value }}
          </div>
        </template>
      </template>

      <template v-if="envelope && activeTab === 1">
        <div class="vdocs:mb-3 vdocs:truncate vdocs:text-base">
          Recipients
        </div>

        <div
          v-for="(recipient, index) in sortedRecipients"
          :key="recipient.role_name"
          class="vdocs:mb-4 vdocs:border vdocs:border-solid vdocs:border-edge vdocs:p-2 vdocs:text-sm"
        >
          <div class="vdocs:mb-1 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-1.5">
            <div class="vdocs:flex vdocs:size-6 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:text-sm vdocs:font-medium">
              {{ index + 1 }}
            </div>
            <div class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:capitalize">
              {{ displayRole(recipient) }}
            </div>
            <div :class="['vdocs:min-w-[90px] vdocs:rounded-[5px] vdocs:px-2 vdocs:py-[3px] vdocs:text-center vdocs:text-sm vdocs:capitalize vdocs:text-white', chipClass(recipient.status)]">
              {{ recipient.status }}
            </div>
            <VerdocsDropdown
              v-if="isOwner && !functionsDisabled"
              :options="recipientMenu(recipient)"
              @option-selected="handleRecipientAction(recipient, $event)"
            />
          </div>

          <div class="vdocs:flex vdocs:flex-col">
            <div class="vdocs:truncate">
              {{ formatFullName(recipient) }}
            </div>
            <div class="vdocs:truncate">
              {{ recipient.email }}
            </div>
            <div
              v-if="recipient.phone"
              class="vdocs:truncate"
            >
              {{ recipient.phone }}
            </div>
          </div>
        </div>

        <div
          v-if="isOwner"
          class="vdocs:mt-1 vdocs:mb-7"
        >
          <div class="vdocs:flex vdocs:flex-row vdocs:items-center">
            <div class="vdocs:flex vdocs:flex-1 vdocs:text-sm">
              Reminders
            </div>
            <VerdocsSwitch
              aria-label="Reminders"
              :checked="remindersEnabled"
              :disabled="functionsDisabled || updatingReminders"
              @update:checked="handleToggleReminders"
            />
          </div>

          <template v-if="remindersEnabled">
            <div class="vdocs:mt-2 vdocs:text-sm">
              NOTE: Reminders will only be sent for up to 14 days.
            </div>
            <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center">
              <div class="vdocs:flex-1 vdocs:text-sm">
                Initial Reminder (days):
              </div>
              <VerdocsTextInput
                aria-label="Initial Reminder (days)"
                placeholder="In days..."
                class="vdocs:mb-0 vdocs:w-[100px]"
                :disabled="functionsDisabled || updatingReminders"
                :model-value="initialDays"
                @update:model-value="initialDaysEdit = $event"
                @blurred="handleCommitReminders"
              />
            </div>
            <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center">
              <div class="vdocs:flex-1 vdocs:text-sm">
                Follow-up Reminders (days):
              </div>
              <VerdocsTextInput
                aria-label="Follow-up Reminders (days)"
                placeholder="In days..."
                class="vdocs:mb-0 vdocs:w-[100px]"
                :disabled="functionsDisabled || updatingReminders"
                :model-value="followupDays"
                @update:model-value="followupDaysEdit = $event"
                @blurred="handleCommitReminders"
              />
            </div>
            <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:text-sm">
              <div class="vdocs:flex-1">
                Next Reminder:
              </div>
              <div class="vdocs:text-white/85">
                {{ nextReminderLabel }}
              </div>
            </div>
          </template>
        </div>

        <VerdocsButton
          v-if="isOwner"
          label="Cancel Envelope"
          class="vdocs:w-full"
          :disabled="functionsDisabled || canceling"
          @click="showCancelDialog = true"
        />
      </template>

      <template v-if="envelope && activeTab === 2">
        <div class="vdocs:mb-1 vdocs:truncate vdocs:text-base">
          History
        </div>
        <div
          v-for="(entry, index) in historyEntries"
          :key="`${entry.icon}-${entry.date.getTime()}-${index}`"
          :class="[
            'vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:pt-2',
            index > 0 ? 'vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-white/25' : '',
          ]"
        >
          <div class="vdocs:mr-3.5 vdocs:shrink-0 vdocs:[&>svg]:size-6 vdocs:[&>svg]:block">
            <VerdocsEnvelopeHistoryIcon :name="entry.icon" />
          </div>
          <div class="vdocs:min-w-0">
            <div class="vdocs:mb-1 vdocs:text-sm">
              {{ entry.message }}
            </div>
            <div class="vdocs:text-xs vdocs:text-white/55">
              {{ timestampFormatter.format(entry.date) }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <VerdocsOkDialog
      v-if="showCancelDialog"
      heading="Cancel Envelope?"
      message="Are you sure you want to cancel this Envelope? This action cannot be undone."
      show-cancel
      @ok="confirmCancel"
      @cancel="showCancelDialog = false"
    />

    <VerdocsOkDialog
      v-if="reinviteRole"
      heading="Re-invite Recipient?"
      :message="REINVITE_MESSAGE"
      show-cancel
      @ok="confirmReinvite"
      @cancel="reinviteRole = ''"
    />

    <VerdocsEnvelopeUpdateRecipient
      v-if="updateRole"
      :endpoint="endpoint"
      :envelope-id="envelopeId"
      :role-name="updateRole"
      @updated="onRecipientUpdated"
      @cancel="updateRole = ''"
      @sdk-error="emit('sdkError', $event)"
    />
  </div>
</template>
