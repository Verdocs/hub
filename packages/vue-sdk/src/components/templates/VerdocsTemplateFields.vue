<script lang="ts">
import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';

/** Reported through templateUpdated whenever a field changes. */
export interface ITemplateFieldsEvent {
  endpoint: VerdocsEndpoint;
  template: ITemplate;
  event: 'updated-field' | 'deleted-field';
}

export interface VerdocsTemplateFieldsProps {
  /** The ID of the template whose fields are displayed. */
  templateId: string;
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
}
</script>

<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue';
import { useQueries } from '@tanstack/vue-query';
import { getTemplateDocumentPageDisplayUri } from '@verdocs/js-sdk';
import type { ITemplateDocument, ITemplateField } from '@verdocs/js-sdk';
import { SDKError } from '../../types';
import VerdocsLoader from '../../controls/VerdocsLoader.vue';
import VerdocsPortal from '../../controls/VerdocsPortal.vue';
import VerdocsComponentError from '../../controls/VerdocsComponentError.vue';
import VerdocsFieldDate from '../../fields/VerdocsFieldDate.vue';
import VerdocsFieldRadio from '../../fields/VerdocsFieldRadio.vue';
import VerdocsFieldTextbox from '../../fields/VerdocsFieldTextbox.vue';
import VerdocsFieldInitial from '../../fields/VerdocsFieldInitial.vue';
import VerdocsFieldPayment from '../../fields/VerdocsFieldPayment.vue';
import VerdocsFieldCheckbox from '../../fields/VerdocsFieldCheckbox.vue';
import VerdocsFieldDropdown from '../../fields/VerdocsFieldDropdown.vue';
import VerdocsFieldTextarea from '../../fields/VerdocsFieldTextarea.vue';
import VerdocsFieldSignature from '../../fields/VerdocsFieldSignature.vue';
import VerdocsFieldTimestamp from '../../fields/VerdocsFieldTimestamp.vue';
import VerdocsFieldAttachment from '../../fields/VerdocsFieldAttachment.vue';
import VerdocsTemplateDocumentPage from './VerdocsTemplateDocumentPage.vue';
import VerdocsTemplateFieldProperties from './VerdocsTemplateFieldProperties.vue';
import { useResolvedEndpoint } from '../../provider/useVerdocs';
import { useTemplate } from '../../composables/useTemplateDetail';

const { templateId, endpoint } = defineProps<VerdocsTemplateFieldsProps>();

const emit = defineEmits<{
  /** React onTemplateUpdated: fired when a field is updated or deleted, e.g. for host cache invalidation. */
  templateUpdated: [event: ITemplateFieldsEvent];
  /** React onSdkError: fired if an error occurs, with information about the error. */
  sdkError: [error: SDKError];
}>();

// The legacy render switch, minus the Stencil store plumbing: each field type
// maps to its display component. Legacy promoted textboxes carrying a leading
// setting to textareas, and fell through to the bare field name for unknown
// types; both behaviors are kept.
const FIELD_COMPONENTS: Record<string, Component> = {
  signature: VerdocsFieldSignature,
  initial: VerdocsFieldInitial,
  textbox: VerdocsFieldTextbox,
  textarea: VerdocsFieldTextarea,
  date: VerdocsFieldDate,
  timestamp: VerdocsFieldTimestamp,
  dropdown: VerdocsFieldDropdown,
  checkbox: VerdocsFieldCheckbox,
  radio: VerdocsFieldRadio,
  attachment: VerdocsFieldAttachment,
  payment: VerdocsFieldPayment,
};

const resolvedEndpoint = useResolvedEndpoint(endpoint);
const { data: template, isPending, error } = useTemplate(() => templateId, endpoint);

const selectedField = ref<{ name: string; anchor: HTMLElement } | null>(null);

watch(error, queryError => {
  if (queryError) {
    const details = queryError as { message: string; response?: { status?: number; data?: unknown } };
    emit('sdkError', new SDKError(details.message, details.response?.status, details.response?.data));
  }
});

const documents = computed(() => template.value?.documents || []);
const fields = computed(() => template.value?.fields || []);
const sortedRoles = computed(() => [ ...(template.value?.roles || []) ].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)));

// Flat list of every page across every document, in render order. The page
// images load through useQueries so the number of requests can grow with the
// template; each key matches the React SDK's ['template-documents', id,
// 'page-image', page].
const pageSlots = computed(() => {
  const slots: { documentId: string; page: number }[] = [];
  for (const document of documents.value) {
    for (let page = 1; page <= (document.pages || 0); page++) {
      slots.push({ documentId: document.id, page });
    }
  }
  return slots;
});

const pageQueries = useQueries({
  queries: computed(() =>
    pageSlots.value.map(slot => ({
      queryKey: [ 'template-documents', slot.documentId, 'page-image', slot.page ],
      queryFn: () => getTemplateDocumentPageDisplayUri(resolvedEndpoint, slot.documentId, slot.page),
    }))),
});

const imageByKey = computed(() => {
  const map = new Map<string, string | undefined>();
  pageSlots.value.forEach((slot, index) => map.set(`${slot.documentId}-${slot.page}`, pageQueries.value[index]?.data));
  return map;
});

// Page sizes are keyed by 1-based page number; US Letter when absent, matching
// the legacy fallback.
const pageSize = (document: ITemplateDocument, page: number) => document.page_sizes?.[page] || { width: 612, height: 792 };

const fieldComponentFor = (field: ITemplateField) => {
  const type = field.type === 'textbox' && (field.settings?.leading ?? 0) > 0 ? 'textarea' : field.type;
  return FIELD_COMPONENTS[type];
};

// Field x/y are PDF points with y measured up from the page bottom; inside the
// document page's field layer those map straight to left/bottom.
const placedFieldsFor = (document: ITemplateDocument, page: number) =>
  fields.value
    .filter(field => field.document_id === document.id && field.page === page)
    .map(field => ({
      field,
      signerIndex: Math.max(sortedRoles.value.findIndex(role => role.name === field.role_name), 0),
      component: fieldComponentFor(field),
    }));

const handleOpen = (field: ITemplateField, anchor: EventTarget | null) => {
  selectedField.value = { name: field.name, anchor: anchor as HTMLElement };
};

// The legacy templateUpdated event carried a hand-merged copy of the template;
// the payloads here match it. The query cache refresh happens in the structure
// mutations, so these are purely host notifications.
const handleSettingsChanged = (event: { fieldName: string; field: ITemplateField }) => {
  const current = template.value;
  if (!current) {
    return;
  }

  emit('templateUpdated', {
    endpoint: resolvedEndpoint,
    template: { ...current, fields: (current.fields || []).map(field => (field.name === event.fieldName ? event.field : field)) },
    event: 'updated-field',
  });
};

const handleFieldDeleted = (event: { templateId: string; fieldName: string }) => {
  const current = template.value;
  selectedField.value = null;
  if (!current) {
    return;
  }

  emit('templateUpdated', {
    endpoint: resolvedEndpoint,
    template: { ...current, fields: (current.fields || []).filter(field => field.name !== event.fieldName) },
    event: 'deleted-field',
  });
};
</script>

<template>
  <div
    v-if="isPending"
    class="vdocs:relative vdocs:min-h-[600px]"
  >
    <VerdocsLoader />
  </div>

  <VerdocsComponentError
    v-else-if="!template"
    message="Unable to load template fields. Please verify you are signed in and try again."
  />

  <div
    v-else
    class="vdocs:relative vdocs:font-sans vdocs:min-h-[600px]"
  >
    <div class="vdocs:flex vdocs:flex-col vdocs:items-center vdocs:box-border vdocs:min-h-[200px] vdocs:p-[15px] vdocs:gap-[15px]">
      <div
        v-for="document in documents"
        :key="document.id"
        class="vdocs:w-full vdocs:flex vdocs:flex-col vdocs:gap-[15px]"
      >
        <div
          v-if="documents.length > 1"
          class="vdocs:box-border vdocs:w-full vdocs:rounded-md vdocs:bg-ink vdocs:text-white vdocs:text-base vdocs:font-medium vdocs:px-5 vdocs:py-3"
        >
          {{ document.name }}
        </div>

        <VerdocsTemplateDocumentPage
          v-for="page in document.pages"
          :key="`${document.id}-${page}`"
          :page-image-uri="imageByKey.get(`${document.id}-${page}`)"
          :virtual-width="pageSize(document, page).width"
          :virtual-height="pageSize(document, page).height"
          :page-number="page"
        >
          <div
            v-for="placed in placedFieldsFor(document, page)"
            :key="placed.field.name"
            role="button"
            tabindex="0"
            :aria-label="`${placed.field.name} settings`"
            class="vdocs:absolute vdocs:box-border vdocs:cursor-pointer vdocs:outline-offset-2 vdocs:focus-visible:outline-2 vdocs:focus-visible:outline-accent"
            :style="{ left: `${placed.field.x}px`, bottom: `${placed.field.y}px`, width: `${placed.field.width}px`, height: `${placed.field.height}px` }"
            @click="handleOpen(placed.field, $event.currentTarget)"
            @keydown.enter.space.prevent="handleOpen(placed.field, $event.currentTarget)"
          >
            <component
              :is="placed.component"
              v-if="placed.component"
              :field="placed.field"
              disabled
              :signer-index="placed.signerIndex"
              class="vdocs:pointer-events-none"
              :style="{ width: '100%', height: '100%' }"
            />
            <template v-else>
              {{ placed.field.name }}
            </template>
          </div>
        </VerdocsTemplateDocumentPage>
      </div>

      <div
        v-if="!documents.length"
        class="vdocs:text-lg vdocs:text-muted vdocs:py-20"
      >
        This template does not have any documents yet.
      </div>
    </div>

    <VerdocsPortal
      v-if="selectedField"
      :anchor="selectedField.anchor"
      @click-away="selectedField = null"
    >
      <VerdocsTemplateFieldProperties
        :template-id="templateId"
        :field-name="selectedField.name"
        :endpoint="endpoint"
        @close="selectedField = null"
        @settings-changed="handleSettingsChanged"
        @field-deleted="handleFieldDeleted"
        @sdk-error="emit('sdkError', $event)"
      />
    </VerdocsPortal>
  </div>
</template>
