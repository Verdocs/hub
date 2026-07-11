<script lang="ts">
import type { VerdocsEndpoint } from '@verdocs/js-sdk';

export interface VerdocsTemplateFieldPropertiesProps {
  /** The ID of the template the field belongs to. */
  templateId: string;
  /** The name of the field to edit. */
  fieldName: string;
  /** If set, the panel gets a help view toggled by an icon in its header. The help slot replaces it for rich content. */
  helpText?: string;
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
}
</script>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue';
import type { ITemplateField } from '@verdocs/js-sdk';
import { SDKError } from '../../types';
import { showToast } from '../../utils/toast';
import VerdocsButton from '../../controls/VerdocsButton.vue';
import VerdocsLoader from '../../controls/VerdocsLoader.vue';
import VerdocsCheckbox from '../../controls/VerdocsCheckbox.vue';
import VerdocsTextInput from '../../controls/VerdocsTextInput.vue';
import VerdocsSelectInput from '../../controls/VerdocsSelectInput.vue';
import { VerdocsHelpCircleIcon } from '../../controls/icons';
import VerdocsTrashIcon from '../../controls/icons/VerdocsTrashIcon.vue';
import { useTemplate } from '../../composables/useTemplateDetail';
import { useDeleteTemplateField, useUpdateTemplateField } from '../../composables/useTemplateStructure';

interface IOptionRow {
  id: string;
  label: string;
}

const { templateId, fieldName, helpText, endpoint } = defineProps<VerdocsTemplateFieldPropertiesProps>();

const emit = defineEmits<{
  /** React onClose: fired when the user cancels the panel, and after a successful save or delete. */
  close: [];
  /** React onDelete: fired after the field has been deleted server-side. */
  fieldDeleted: [event: { templateId: string; fieldName: string }];
  /** React onSettingsChanged: fired after the field's settings are saved, with the updated field. */
  settingsChanged: [event: { fieldName: string; field: ITemplateField }];
  /** React onSdkError: fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
}>();

const PANEL_CLASSES =
  'vdocs:box-border vdocs:w-80 vdocs:p-5 vdocs:rounded-ctl vdocs:bg-surface vdocs:border vdocs:border-solid '
  + 'vdocs:border-edge-light vdocs:shadow-[2px_2px_10px_0_rgba(0,0,0,0.12)] vdocs:font-sans vdocs:text-ink';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const isFilledOption = (option: IOptionRow) => option.id.trim() !== '' || option.label.trim() !== '';

// The options grid always ends with one blank row so there is somewhere to type
// a new entry, mirroring the legacy cleanupOptions behavior.
const withBlankRow = (options: IOptionRow[]): IOptionRow[] => [ ...options.filter(isFilledOption), { id: '', label: '' } ];

const slots = useSlots();

const { data: template, isPending, error } = useTemplate(() => templateId, endpoint);
const { mutate: updateField, isPending: updating } = useUpdateTemplateField(endpoint);
const { mutate: deleteField, isPending: deleting } = useDeleteTemplateField(endpoint);

const field = computed(() => (template.value?.fields || []).find(candidate => candidate.name === fieldName));
const roleOptions = computed(() => (template.value?.roles || []).map(role => ({ label: role.name, value: role.name })));

const dirty = ref(false);
const showingHelp = ref(false);
const name = ref('');
const label = ref('');
const roleName = ref('');
const required = ref(false);
const readOnly = ref(false);
const group = ref('');
const placeholder = ref('');
const defaultValue = ref('');
const options = ref<IOptionRow[]>([ { id: '', label: '' } ]);

// Seed the draft once per field (keyed by the field's name, mirroring React's
// key={fieldName} remount) rather than syncing props to state on every change.
const seedFromField = () => {
  const f = field.value;
  if (!f) {
    return;
  }

  dirty.value = false;
  name.value = f.name;
  label.value = f.label || '';
  roleName.value = f.role_name;
  required.value = !!f.required;
  readOnly.value = !!f.readonly;
  group.value = f.group || '';
  placeholder.value = f.placeholder || '';
  defaultValue.value = f.default || '';
  options.value = withBlankRow(f.options || []);
};

watch(() => field.value?.name, seedFromField, { immediate: true });

watch(error, queryError => {
  if (queryError) {
    const details = queryError as { message: string; response?: { status?: number; data?: unknown } };
    emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
  }
});

const hasHelp = computed(() => !!helpText || !!slots.help);
const title = computed(() => (field.value ? `${capitalize(field.value.type.replace(/_/g, ' '))} Settings` : ''));
const isTextField = computed(() => field.value?.type === 'textbox' || field.value?.type === 'textarea');
const filledOptions = computed(() => options.value.filter(isFilledOption));

const saveDisabled = computed(() =>
  !dirty.value
  || updating.value
  || (field.value?.type === 'dropdown' && !filledOptions.value.length)
  || (readOnly.value && !defaultValue.value));

const reportError = (err: unknown) => {
  const e = err as { message: string; response?: { status?: number; data?: unknown } };
  emit('sdkError', new SDKError(e.message, e.response?.status, e.response?.data));
};

const setDirty = (setter: () => void) => {
  setter();
  dirty.value = true;
};

const handleSave = () => {
  const current = field.value;
  if (!current) {
    return;
  }

  updateField(
    {
      templateId,
      name: current.name,
      params: {
        name: name.value,
        role_name: roleName.value,
        required: required.value,
        readonly: readOnly.value,
        label: label.value || null,
        group: group.value || null,
        placeholder: placeholder.value || null,
        default: defaultValue.value || null,
        options: filledOptions.value,
      },
    },
    {
      onSuccess: updated => {
        emit('settingsChanged', { fieldName: current.name, field: updated });
        emit('close');
      },
      onError: error => {
        showToast('Error updating field, please try again later', { style: 'error' });
        reportError(error);
      },
    },
  );
};

const handleDelete = () => {
  const current = field.value;
  if (!current) {
    return;
  }

  deleteField(
    { templateId, name: current.name },
    {
      onSuccess: () => {
        emit('fieldDeleted', { templateId, fieldName: current.name });
        emit('close');
      },
      onError: error => {
        showToast('Error deleting field, please try again later', { style: 'error' });
        reportError(error);
      },
    },
  );
};

const handleCancel = () => {
  seedFromField();
  emit('close');
};

const handleGroupInput = (value: string) => {
  // Group names are normalized the way the legacy editor did it, so radio
  // buttons grouped across sessions keep matching.
  setDirty(() => {
    group.value = (value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  });
};

const handleOptionChange = (index: number, key: 'id' | 'label', value: string) => {
  setDirty(() => {
    options.value = withBlankRow(options.value.map((option, i) => (i === index ? { ...option, [key]: value } : option)));
  });
};

const handleRemoveOption = (index: number) => {
  setDirty(() => {
    options.value = withBlankRow(options.value.filter((_option, i) => i !== index));
  });
};
</script>

<template>
  <div
    v-if="isPending"
    :class="[PANEL_CLASSES, 'vdocs:relative vdocs:min-h-40']"
  >
    <VerdocsLoader />
  </div>

  <div
    v-else-if="field && showingHelp && hasHelp"
    :class="PANEL_CLASSES"
  >
    <h6 class="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
      {{ title }}
      <span class="vdocs:flex-1" />
      <button
        type="button"
        aria-label="Hide help"
        class="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100"
        @click="showingHelp = false"
      >
        <VerdocsHelpCircleIcon class="vdocs:size-6" />
      </button>
    </h6>

    <div class="vdocs:text-sm">
      <slot name="help">
        {{ helpText }}
      </slot>
    </div>
  </div>

  <div
    v-else-if="field"
    :class="PANEL_CLASSES"
  >
    <h6 class="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
      {{ title }}
      <span class="vdocs:flex-1" />
      <button
        v-if="hasHelp"
        type="button"
        aria-label="Show help"
        class="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100"
        @click="showingHelp = true"
      >
        <VerdocsHelpCircleIcon class="vdocs:size-6" />
      </button>
    </h6>

    <VerdocsTextInput
      label="Field Name"
      :model-value="name"
      autocomplete="off"
      placeholder="Field Name..."
      @update:model-value="value => setDirty(() => (name = value))"
    />

    <VerdocsTextInput
      label="Optional Label"
      :model-value="label"
      autocomplete="off"
      placeholder="Optional Label..."
      @update:model-value="value => setDirty(() => (label = value))"
    />

    <VerdocsSelectInput
      label="Role"
      :model-value="roleName"
      :options="roleOptions"
      @update:model-value="value => setDirty(() => (roleName = value))"
    />

    <VerdocsTextInput
      v-if="isTextField"
      label="Default Value"
      :model-value="defaultValue"
      autocomplete="off"
      :placeholder="readOnly && !defaultValue ? 'Default value required' : 'Pre-filled value...'"
      @update:model-value="value => setDirty(() => (defaultValue = value))"
    />

    <VerdocsTextInput
      v-if="field.type === 'radio'"
      label="Group"
      :model-value="group"
      autocomplete="off"
      placeholder="Group..."
      description="Enable exclusive selections. Only one option within the same group may be selected at a time."
      @update:model-value="handleGroupInput"
    />

    <VerdocsTextInput
      v-if="isTextField"
      label="Placeholder"
      :model-value="placeholder"
      autocomplete="off"
      placeholder="Placeholder..."
      @update:model-value="value => setDirty(() => (placeholder = value))"
    />

    <div class="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:my-2.5">
      <VerdocsCheckbox
        label="Required"
        :checked="required"
        @update:checked="value => setDirty(() => (required = value))"
      />

      <VerdocsCheckbox
        label="Read-only"
        :checked="readOnly"
        @update:checked="value => setDirty(() => (readOnly = value))"
      />
    </div>

    <div
      v-if="field.type === 'dropdown'"
      class="vdocs:bg-canvas vdocs:rounded-ctl vdocs:p-2.5 vdocs:mt-2.5"
    >
      <div class="vdocs:flex vdocs:gap-2 vdocs:mb-1 vdocs:text-sm vdocs:font-bold">
        <div class="vdocs:flex-1">
          ID
        </div>
        <div class="vdocs:flex-1">
          Label
        </div>
        <div class="vdocs:w-7" />
      </div>

      <div
        v-for="(option, index) in options"
        :key="index"
        class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:mb-1"
      >
        <VerdocsTextInput
          :aria-label="`Option ${index + 1} ID`"
          :model-value="option.id"
          placeholder="Unique ID"
          class="vdocs:flex-1 vdocs:mb-0"
          @update:model-value="value => handleOptionChange(index, 'id', value)"
        />
        <VerdocsTextInput
          :aria-label="`Option ${index + 1} label`"
          :model-value="option.label"
          placeholder="Display label"
          class="vdocs:flex-1 vdocs:mb-0"
          @update:model-value="value => handleOptionChange(index, 'label', value)"
        />
        <button
          type="button"
          :aria-label="`Remove option ${index + 1}`"
          class="vdocs:flex vdocs:size-7 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-ink vdocs:cursor-pointer vdocs:hover:text-danger"
          @click="handleRemoveOption(index)"
        >
          <VerdocsTrashIcon class="vdocs:size-5" />
        </button>
      </div>
    </div>

    <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:mt-[30px]">
      <button
        type="button"
        aria-label="Delete field"
        :disabled="dirty || deleting"
        class="vdocs:flex vdocs:size-[34px] vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-danger vdocs:cursor-pointer vdocs:disabled:opacity-40 vdocs:disabled:cursor-default"
        @click="handleDelete"
      >
        <VerdocsTrashIcon class="vdocs:size-5" />
      </button>
      <div class="vdocs:flex-1" />
      <VerdocsButton
        size="small"
        variant="outline"
        label="Cancel"
        :disabled="!dirty"
        @click="handleCancel"
      />
      <VerdocsButton
        size="small"
        label="Save"
        :disabled="saveDisabled"
        @click="handleSave"
      />
    </div>
  </div>
</template>
