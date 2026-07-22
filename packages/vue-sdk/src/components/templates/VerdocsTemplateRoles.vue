<script lang="ts">
import type { IRole, VerdocsEndpoint } from '@verdocs/js-sdk';

/** Payload for the rolesUpdated event fired by VerdocsTemplateRoles. */
export interface IRolesUpdatedEvent {
  endpoint: VerdocsEndpoint;
  templateId: string;
  event: 'added' | 'deleted' | 'updated';
  roles: IRole[];
}

export interface VerdocsTemplateRolesProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The template ID to edit. */
  templateId: string;
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatFullName } from '@verdocs/js-sdk';
import { useQueryClient } from '@tanstack/vue-query';
import type { ITemplate } from '@verdocs/js-sdk';
import { SDKError } from '../../types';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsPortal from '../../controls/VerdocsPortal.vue';
import VerdocsComponentError from '../../controls/VerdocsComponentError.vue';
import VerdocsTemplateRoleProperties from './VerdocsTemplateRoleProperties.vue';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useTemplate } from '../../composables/useTemplateDetail';
import { useCreateTemplateRole } from '../../composables/useTemplateStructure';

const { endpoint, templateId } = defineProps<VerdocsTemplateRolesProps>();

const emit = defineEmits<{
  /** React onRolesUpdated: fired when the template's roles change, with the refreshed role list. */
  rolesUpdated: [event: IRolesUpdatedEvent];
  /** React onNext: fired when the user clicks OK to proceed. */
  next: [];
  /** React onCancel: fired when the user clicks Cancel. */
  cancel: [];
  /** React onSdkError: fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
}>();

const sortRoles = (roles: IRole[]) =>
  [ ...roles ].sort((a, b) => (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence));

// Role names are UGC and can be anything, so the generated name has to dodge
// whatever already exists, not just count upward.
const nextRoleName = (roles: IRole[]) => {
  let nextNumber = roles.length;
  let name = '';
  do {
    nextNumber++;
    name = `Recipient ${nextNumber}`;
  } while (roles.some(role => role.name === name));

  return name;
};

const resolvedEndpoint = useResolvedEndpoint(endpoint);
const queryClient = useQueryClient();
const { data: template, error } = useTemplate(() => templateId, endpoint);
const { mutate: createRole, isPending: creating } = useCreateTemplateRole(endpoint);

const editing = ref<{ roleName: string; anchor: HTMLElement } | null>(null);
// The legacy chips swapped the type icon for a gear on hover via CSS; we track
// hover/focus in state instead so keyboard users get the same affordance.
const gearRole = ref<string | null>(null);

watch(error, queryError => {
  if (queryError) {
    const details = queryError as { message: string; response?: { status?: number; data?: unknown } };
    emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
  }
});

const sortedRoles = computed(() => sortRoles(template.value?.roles || []));
const sequences = computed(() => [ ...new Set(sortedRoles.value.map(role => role.sequence)) ]);
const nextSequence = computed(() => (sequences.value.length > 0 ? (sequences.value[sequences.value.length - 1] || 0) + 1 : 1));
const editingRole = computed(() => (editing.value ? sortedRoles.value.find(role => role.name === editing.value!.roleName) : undefined));

const rolesAtSequence = (sequence: number) => sortedRoles.value.filter(role => role.sequence === sequence);

// Roles with complete contact info are "known" and display as people; the rest
// are placeholders filled in when each envelope is created.
const chipLabel = (role: IRole) => ((!role.email || !role.first_name || !role.last_name) ? role.name : formatFullName(role));

const notifyRolesUpdated = (event: IRolesUpdatedEvent['event']) => {
  // The role mutations' cache invalidation is awaited before this runs, so the
  // cache already holds the refreshed template.
  const fresh = queryClient.getQueryData<ITemplate>([ 'templates', templateId ]);
  emit('rolesUpdated', { endpoint: resolvedEndpoint, templateId, event, roles: sortRoles(fresh?.roles || []) });
};

const handleAddRole = (sequence: number) => {
  createRole(
    {
      templateId,
      role: {
        template_id: templateId,
        name: nextRoleName(sortedRoles.value),
        type: 'signer',
        sequence,
        order: rolesAtSequence(sequence).length + 1,
        full_name: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
        delegator: false,
        name_locked: false,
      },
    },
    {
      onSuccess: () => notifyRolesUpdated('added'),
      onError: error => {
        const err = error as Error & { response?: { status?: number; data?: unknown } };
        emit('sdkError', new SDKError(err.message, err.response?.status, err.response?.data));
      },
    },
  );
};

const openEditor = (roleName: string, anchor: EventTarget | null) => {
  editing.value = { roleName, anchor: anchor as HTMLElement };
};

const handleCloseEditor = () => {
  editing.value = null;
};

const handleRoleDeleted = () => {
  editing.value = null;
  notifyRolesUpdated('deleted');
};
</script>

<template>
  <div
    v-if="error"
    class="vdocs:max-w-[600px]"
  >
    <VerdocsComponentError message="Unable to load this template. Please try again later." />
  </div>

  <div
    v-else-if="!template"
    class="vdocs:max-w-[600px] vdocs:p-3"
  >
    <div
      v-for="row in 3"
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
      Roles and Workflow
    </h5>

    <div class="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:mt-2.5">
      <div
        v-for="(sequence, index) in sequences"
        :key="sequence"
        class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:pb-2 vdocs:font-medium vdocs:border-b vdocs:border-dotted vdocs:border-edge-light"
      >
        <div class="vdocs:text-lg vdocs:leading-8">
          {{ index + 1 }}.
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5">
          <div
            v-for="role in rolesAtSequence(sequence)"
            :key="role.name"
            class="vdocs:relative vdocs:box-border vdocs:flex vdocs:h-8 vdocs:max-w-[200px] vdocs:flex-col vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-info/10 vdocs:pl-[34px] vdocs:pr-3.5"
          >
            <div class="vdocs:overflow-hidden vdocs:text-sm vdocs:font-normal vdocs:leading-[30px] vdocs:whitespace-nowrap vdocs:text-ellipsis">
              {{ chipLabel(role) }}
            </div>

            <button
              type="button"
              :aria-label="`Edit role ${role.name}`"
              class="vdocs:absolute vdocs:left-1 vdocs:top-1 vdocs:flex vdocs:size-6 vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-ink/60"
              @mouseenter="gearRole = role.name"
              @mouseleave="gearRole = gearRole === role.name ? null : gearRole"
              @focus="gearRole = role.name"
              @blur="gearRole = gearRole === role.name ? null : gearRole"
              @click="openEditor(role.name, $event.currentTarget)"
            >
              <svg
                v-if="gearRole === role.name"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                class="vdocs:size-5"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                />
              </svg>
              <svg
                v-else-if="role.type === 'cc'"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                class="vdocs:size-5 vdocs:opacity-60"
              >
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              <svg
                v-else-if="role.type === 'approver'"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                class="vdocs:size-5 vdocs:opacity-60"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                class="vdocs:size-5 vdocs:opacity-60"
              >
                <path d="m9.225 21.225 4.65-4.65h8.45v4.65Zm-5.35-2.2H5.05l8.5-8.5-1.175-1.175-8.5 8.5Zm14.25-9.95L13.8 4.8l1.325-1.325q.625-.65 1.525-.663.9-.012 1.6.663l1.225 1.175q.675.675.663 1.562-.013.888-.663 1.513ZM16.7 10.55 6 21.225H1.675V16.9L12.35 6.225Zm-3.725-.625-.6-.575 1.175 1.175Z" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="button"
          :disabled="creating"
          class="vdocs:h-8 vdocs:px-2.5 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:cursor-pointer vdocs:opacity-40 vdocs:hover:opacity-100 vdocs:disabled:opacity-20 vdocs:disabled:cursor-default"
          @click="handleAddRole(sequence)"
        >
          + Add Role
        </button>
      </div>

      <div
        class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:pb-2 vdocs:font-medium vdocs:text-muted vdocs:border-b vdocs:border-dotted vdocs:border-edge-light"
      >
        <div class="vdocs:text-lg vdocs:leading-8">
          {{ sequences.length + 1 }}.
        </div>

        <button
          type="button"
          :disabled="creating"
          class="vdocs:h-8 vdocs:px-2.5 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:cursor-pointer vdocs:opacity-40 vdocs:hover:opacity-100 vdocs:disabled:opacity-20 vdocs:disabled:cursor-default"
          @click="handleAddRole(nextSequence)"
        >
          + Add Role
        </button>
      </div>
    </div>

    <div
      v-if="sortedRoles.length < 1"
      class="vdocs:text-[13px] vdocs:mt-4 vdocs:mb-1"
    >
      You must add at least one Role before proceeding. Click the + Add Role button above to get started.
    </div>

    <div class="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
      <div class="vdocs:flex vdocs:flex-1" />
      <VerdocsButton
        variant="outline"
        label="Cancel"
        size="small"
        @click="emit('cancel')"
      />
      <VerdocsButton
        label="OK"
        size="small"
        :disabled="sortedRoles.length < 1"
        @click="emit('next')"
      />
    </div>

    <VerdocsPortal
      v-if="editing && editingRole"
      :anchor="editing.anchor"
      @click-away="handleCloseEditor"
    >
      <VerdocsTemplateRoleProperties
        :endpoint="endpoint"
        :template-id="templateId"
        :role="editingRole"
        @close="handleCloseEditor"
        @role-deleted="handleRoleDeleted"
        @sdk-error="emit('sdkError', $event)"
      />
    </VerdocsPortal>
  </form>
</template>
