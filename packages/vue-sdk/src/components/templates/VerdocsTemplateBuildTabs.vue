<script lang="ts">
import type { ITemplate } from '@verdocs/js-sdk';

/** The steps in the template builder, in presentation order. */
export type TVerdocsBuildStep = 'attachments' | 'roles' | 'fields' | 'preview';

export interface VerdocsTemplateBuildTabsProps {
  /** The step to show as selected. */
  selectedStep: TVerdocsBuildStep;
  /**
   * The template being built. Steps unlock as it gains content: Workflow needs
   * a document, Fields needs a role, and Preview needs a field. Omit it (e.g.
   * before the template is created) to leave only Attachments enabled.
   */
  template?: ITemplate | null;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import VerdocsTabs, { type ITab } from '../../controls/VerdocsTabs.vue';

const { selectedStep, template } = defineProps<VerdocsTemplateBuildTabsProps>();

const emit = defineEmits<{
  /** Fired when the user selects a different, enabled step (the React tabs' onSelectStep). */
  selectStep: [step: TVerdocsBuildStep];
}>();

const STEP_IDS: TVerdocsBuildStep[] = [ 'attachments', 'roles', 'fields', 'preview' ];

// Same gating chain as the legacy builder: each step requires the previous one
// to have produced content.
const tabs = computed<ITab[]>(() => {
  const canEditRoles = (template?.documents || []).length > 0;
  const canEditFields = canEditRoles && (template?.roles || []).length > 0;
  const canPreview = canEditFields && (template?.fields || []).length > 0;

  return [
    { id: 'attachments', label: 'Attachments' },
    { id: 'roles', label: 'Workflow', disabled: !canEditRoles },
    { id: 'fields', label: 'Fields', disabled: !canEditFields },
    { id: 'preview', label: 'Preview & Send', disabled: !canPreview },
  ];
});

const selectedIndex = computed(() => STEP_IDS.indexOf(selectedStep));

const handleSelectTab = (tab: ITab) => {
  emit('selectStep', tab.id as TVerdocsBuildStep);
};
</script>

<template>
  <div class="vdocs:w-full vdocs:bg-surface vdocs:border-0 vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-2.5 vdocs:pt-1.5">
    <VerdocsTabs
      :tabs="tabs"
      :selected-tab="selectedIndex"
      @select-tab="handleSelectTab"
    />
  </div>
</template>
