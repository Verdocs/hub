<script lang="ts">
import type { TRecipientStatus, VerdocsEndpoint } from '@verdocs/js-sdk';

export interface VerdocsEnvelopeRecipientSummaryProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The envelope to summarize. */
  envelopeId: string;
  /** Enable or disable the Send Another button. */
  canSendAnother?: boolean;
  /** Enable or disable the View button. */
  canView?: boolean;
  /** Enable or disable the Done button. */
  canDone?: boolean;
}

const STATUS_CLASSES: Partial<Record<TRecipientStatus, string>> = {
  invited: 'vdocs:bg-[#ff8f00]',
  signed: 'vdocs:bg-success',
  submitted: 'vdocs:bg-success',
  pending: 'vdocs:bg-info',
  canceled: 'vdocs:bg-danger',
  declined: 'vdocs:bg-danger',
};
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { IRecipient } from '@verdocs/js-sdk';
import { formatFullName, getRecipientsWithActions, recipientCanAct } from '@verdocs/js-sdk';
import type { IEnvelopeEvent } from '../VerdocsEnvelopesList/VerdocsEnvelopesList.vue';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useEnvelope, useInPersonLink } from '../../composables/useEnvelopes';
import VerdocsComponentError from '../../controls/VerdocsComponentError.vue';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import { showToast } from '../../utils/toast';
import { SDKError } from '../../types';

const { endpoint, envelopeId, canSendAnother = true, canView = true, canDone = true } = defineProps<VerdocsEnvelopeRecipientSummaryProps>();

const emit = defineEmits<{
  /** Fired when the user clicks Send Another. The host should route to its send flow. React's onAnother. */
  another: [event: IEnvelopeEvent];
  /** Fired when the user clicks View Now. The host should route to its envelope view. React's onView. */
  view: [event: IEnvelopeEvent];
  /** Fired when the user clicks Done. The host should route to its next workflow step. React's onDone. */
  done: [event: IEnvelopeEvent];
  /** Fired if an error occurs, with information about the error. React's onSdkError. */
  sdkError: [error: SDKError];
}>();

const toSdkError = (error: unknown) => {
  const e = error as { message: string; response?: { status?: number; data?: unknown } };
  return new SDKError(e.message, e.response?.status, e.response?.data);
};

const resolvedEndpoint = useResolvedEndpoint(endpoint);
const { data: envelope, error, isPending } = useEnvelope(() => envelopeId, endpoint);
const { mutate: getLink, isPending: gettingLinkPending, variables: linkVariables } = useInPersonLink(() => envelopeId, endpoint);

const links = ref<Record<string, string>>({});

watch(error, queryError => {
  if (queryError) {
    emit('sdkError', toSdkError(queryError));
  }
});

const handleCopyLink = (link: string | undefined) => {
  if (!link) {
    return;
  }

  navigator.clipboard
    .writeText(link)
    .then(() => showToast('Link copied to clipboard.', { style: 'success' }))
    .catch(copyError => {
      showToast('Unable to copy to the clipboard.', { style: 'error' });
      emit('sdkError', toSdkError(copyError));
    });
};

const handleGetLink = (roleName: string) => {
  getLink(roleName, {
    onSuccess: (response, requestedRole) => {
      links.value = { ...links.value, [requestedRole]: response.link };
      handleCopyLink(response.link);
    },
    onError: mutationError => {
      showToast(`Unable to get link: ${(mutationError as Error).message}`, { style: 'error' });
      emit('sdkError', toSdkError(mutationError));
    },
  });
};

const recipientsWithActions = computed(() => (envelope.value ? getRecipientsWithActions(envelope.value) : []));
const sortedRecipients = computed(() =>
  [ ...(envelope.value?.recipients ?? []) ].sort((a, b) => (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence)));

const showLinkButton = (recipient: IRecipient) => recipientCanAct(recipient, recipientsWithActions.value);
const isGettingLink = (recipient: IRecipient) => gettingLinkPending.value && linkVariables.value === recipient.role_name;
const chipClass = (status: TRecipientStatus) => STATUS_CLASSES[status] ?? 'vdocs:bg-muted';
const recipientLabel = (recipient: IRecipient) => `${formatFullName(recipient)} (${recipient.email || recipient.phone})`;

const emitAnother = () => {
  if (envelope.value) {
    emit('another', { endpoint: resolvedEndpoint, envelope: envelope.value });
  }
};

const emitView = () => {
  if (envelope.value) {
    emit('view', { endpoint: resolvedEndpoint, envelope: envelope.value });
  }
};

const emitDone = () => {
  if (envelope.value) {
    emit('done', { endpoint: resolvedEndpoint, envelope: envelope.value });
  }
};
</script>

<template>
  <!-- The legacy component rendered nothing while loading. The summary is shown right
       after a send, so the data is usually already cached anyway. -->
  <VerdocsComponentError
    v-if="!isPending && !envelope"
    message="Unable to load envelope. Please try again later."
  />

  <div
    v-else-if="envelope"
    class="vdocs:flex vdocs:w-[600px] vdocs:max-w-full vdocs:flex-col vdocs:rounded-md vdocs:bg-surface vdocs:px-5 vdocs:pt-[30px] vdocs:pb-5 vdocs:font-sans vdocs:box-border"
  >
    <h1 class="vdocs:m-0 vdocs:mb-2.5 vdocs:text-xl vdocs:font-bold vdocs:text-ink">
      Recipient Summary
    </h1>

    <div>
      <div
        v-for="recipient in sortedRecipients"
        :key="recipient.role_name"
        class="vdocs:mt-2 vdocs:mb-6 vdocs:flex vdocs:flex-col vdocs:text-muted"
      >
        <div class="vdocs:mb-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
          <div class="vdocs:flex-1 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">
            {{ recipient.role_name }}
          </div>
          <div :class="['vdocs:min-w-[100px] vdocs:rounded-[5px] vdocs:px-2 vdocs:py-[3px] vdocs:text-center vdocs:text-sm vdocs:capitalize vdocs:text-white', chipClass(recipient.status)]">
            {{ recipient.status }}
          </div>
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-[5px]">
          <div class="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:truncate vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
            {{ recipientLabel(recipient) }}
          </div>
          <VerdocsButton
            v-if="showLinkButton(recipient) && !links[recipient.role_name]"
            size="small"
            variant="outline"
            label="Get Link"
            :disabled="isGettingLink(recipient)"
            @click="handleGetLink(recipient.role_name)"
          />
        </div>

        <div
          v-if="links[recipient.role_name]"
          class="vdocs:mt-1 vdocs:flex vdocs:flex-row vdocs:gap-[5px]"
        >
          <div class="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:overflow-hidden vdocs:truncate vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
            {{ links[recipient.role_name] }}
          </div>
          <VerdocsButton
            size="small"
            variant="outline"
            label="Copy"
            @click="handleCopyLink(links[recipient.role_name])"
          />
        </div>
      </div>
    </div>

    <div
      v-if="canSendAnother || canView || canDone"
      class="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:gap-[15px]"
    >
      <VerdocsButton
        v-if="canSendAnother"
        size="small"
        label="Send Another"
        class="vdocs:min-w-[120px]"
        @click="emitAnother"
      />
      <VerdocsButton
        v-if="canView"
        size="small"
        label="View Now"
        class="vdocs:min-w-[120px]"
        @click="emitView"
      />
      <VerdocsButton
        v-if="canDone"
        size="small"
        label="Done"
        class="vdocs:min-w-[120px]"
        @click="emitDone"
      />
    </div>
  </div>
</template>
