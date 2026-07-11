<script lang="ts">
import type { IRole, VerdocsEndpoint } from '@verdocs/js-sdk';

export interface VerdocsTemplateRolePropertiesProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The template ID the role belongs to. */
  templateId: string;
  /** The role to edit. */
  role: IRole;
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isValidEmail } from '@verdocs/js-sdk';
import type { TRecipientType } from '@verdocs/js-sdk';
import { SDKError } from '../../types';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsCheckbox from '../../controls/VerdocsCheckbox.vue';
import VerdocsHelpIcon from '../../controls/VerdocsHelpIcon.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsSelectInput from '../../controls/VerdocsSelectInput.vue';
import VerdocsTrashIcon from '../../controls/icons/VerdocsTrashIcon.vue';
import { useTemplate } from '../../composables/useTemplateDetail';
import { useDeleteTemplateRole, useUpdateTemplateRole } from '../../composables/useTemplateStructure';

/** Pending form edits, layered over the role prop. An empty object means the form is clean. */
interface IRoleEdits {
  name?: string;
  type?: TRecipientType;
  sequence?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  delegator?: boolean;
}

const { endpoint, templateId, role } = defineProps<VerdocsTemplateRolePropertiesProps>();

const emit = defineEmits<{
  /** React onClose: fired when the panel should close, after a save or when the user dismisses it. */
  close: [];
  /**
   * React onDelete: fired when the user deletes the role. The role has already
   * been deleted server-side when this fires; the parent should update to match.
   */
  roleDeleted: [event: { templateId: string; roleName: string }];
  /** React onSdkError: fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
}>();

const TypeOptions = [
  { label: 'Signer', value: 'signer' },
  { label: 'CC', value: 'cc' },
  { label: 'Approver', value: 'approver' },
];

// Only needed to know whether fields reference this role; roles are renameable
// until fields point at them by name.
const { data: template } = useTemplate(() => templateId, endpoint);
const { mutate: updateRole, isPending: updating } = useUpdateTemplateRole(endpoint);
const { mutate: deleteRole, isPending: deleting } = useDeleteTemplateRole(endpoint);

const edits = ref<IRoleEdits>({});
const dirty = computed(() => Object.keys(edits.value).length > 0);

const hasFields = computed(() => (template.value?.fields || []).some(field => field.role_name === role.name));

const name = computed(() => edits.value.name ?? role.name);
const type = computed(() => edits.value.type ?? role.type);
const sequence = computed(() => edits.value.sequence ?? role.sequence);
const firstName = computed(() => edits.value.first_name ?? role.first_name ?? '');
const lastName = computed(() => edits.value.last_name ?? role.last_name ?? '');
const email = computed(() => edits.value.email ?? role.email ?? '');
const phone = computed(() => edits.value.phone ?? role.phone ?? '');
const delegator = computed(() => edits.value.delegator ?? role.delegator ?? false);

// Contact info is all-or-nothing: leave it blank to fill in at send time, or
// supply a complete first/last/email set for a "known" role.
const isValid = computed(() =>
  (!email.value && !firstName.value && !lastName.value) || (isValidEmail(email.value) && !!firstName.value && !!lastName.value));

const setEdit = (edit: IRoleEdits) => {
  edits.value = { ...edits.value, ...edit };
};

const reportError = (error: unknown) => {
  const err = error as { message: string; response?: { status?: number; data?: unknown } };
  emit('sdkError', new SDKError(err.message, err.response?.status, err.response?.data));
};

const handleSave = () => {
  updateRole(
    {
      templateId,
      name: role.name,
      params: {
        name: name.value,
        type: type.value,
        sequence: sequence.value,
        first_name: firstName.value,
        last_name: lastName.value,
        email: email.value,
        phone: phone.value,
        delegator: delegator.value,
      },
    },
    {
      onSuccess: () => {
        edits.value = {};
        emit('close');
      },
      onError: reportError,
    },
  );
};

const handleDelete = () => {
  if (!window.confirm('Are you sure you wish to remove this role? All associated fields will be removed as well. This action cannot be undone.')) {
    return;
  }

  deleteRole(
    { templateId, name: role.name },
    {
      onSuccess: () => {
        emit('roleDeleted', { templateId, roleName: role.name });
        emit('close');
      },
      onError: reportError,
    },
  );
};
</script>

<template>
  <form
    autocomplete="off"
    class="vdocs:box-border vdocs:flex vdocs:w-80 vdocs:flex-col vdocs:gap-[15px] vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:p-5 vdocs:font-sans vdocs:text-ink vdocs:shadow-lg"
    @submit.prevent
  >
    <div>
      <VerdocsTextInput
        label="Role Name (Must be unique)"
        :model-value="name"
        autocomplete="off"
        :disabled="hasFields"
        placeholder="Role Name..."
        class="vdocs:mb-0"
        @update:model-value="value => setEdit({ name: value })"
      />
      <div
        v-if="hasFields"
        class="vdocs:mt-[7px] vdocs:text-xs vdocs:italic"
      >
        This role has fields assigned and can no longer be renamed.
      </div>
    </div>

    <VerdocsSelectInput
      label="Type"
      :model-value="type"
      :options="TypeOptions"
      class="vdocs:mb-0"
      @update:model-value="value => setEdit({ type: value as TRecipientType })"
    />

    <VerdocsTextInput
      label="Sequence"
      type="number"
      :min="1"
      :model-value="String(sequence)"
      autocomplete="off"
      class="vdocs:mb-0"
      description="Roles sharing a sequence number act in parallel; higher numbers act later."
      @update:model-value="value => setEdit({ sequence: Math.max(1, Math.floor(+value || 1)) })"
    />

    <div>
      <div class="vdocs:mb-1 vdocs:text-sm vdocs:font-bold vdocs:text-muted">
        Default Contact Info:
      </div>

      <div class="vdocs:flex vdocs:flex-row vdocs:gap-[15px]">
        <VerdocsTextInput
          aria-label="First Name"
          :model-value="firstName"
          autocomplete="off"
          placeholder="First..."
          class="vdocs:mb-0"
          @update:model-value="value => setEdit({ first_name: value })"
        />

        <VerdocsTextInput
          aria-label="Last Name"
          :model-value="lastName"
          autocomplete="off"
          placeholder="Last..."
          class="vdocs:mb-0"
          @update:model-value="value => setEdit({ last_name: value })"
        />
      </div>
    </div>

    <VerdocsTextInput
      aria-label="Email Address"
      :model-value="email"
      autocomplete="off"
      placeholder="Email Address..."
      class="vdocs:mb-0"
      @update:model-value="value => setEdit({ email: value })"
    />

    <VerdocsTextInput
      aria-label="Phone Number"
      :model-value="phone"
      autocomplete="off"
      placeholder="Phone Number..."
      class="vdocs:mb-0"
      @update:model-value="value => setEdit({ phone: value })"
    />

    <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
      <VerdocsCheckbox
        label="May Delegate"
        :checked="delegator"
        @update:checked="value => setEdit({ delegator: value })"
      />
      <VerdocsHelpIcon>
        If enabled, this recipient may delegate their actions to another individual.
      </VerdocsHelpIcon>
    </div>

    <div class="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-between">
      <button
        type="button"
        aria-label="Delete Role"
        :disabled="dirty || deleting"
        class="vdocs:flex vdocs:h-[34px] vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:px-1.5 vdocs:text-danger vdocs:active:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:text-disabled"
        @click="handleDelete"
      >
        <VerdocsTrashIcon class="vdocs:size-6" />
      </button>

      <VerdocsButton
        size="small"
        label="Save"
        :disabled="!dirty || !isValid || updating"
        @click="handleSave"
      />
    </div>
  </form>
</template>
