<script lang="ts">
import type { IEnvelopeDocument } from '@verdocs/js-sdk';

/**
 * The download flavors the user can choose: a single attachment as-is, the
 * signing certificate, everything merged into one PDF, or a ZIP of all files.
 */
export type TDownloadVariant = 'document' | 'certificate' | 'combined' | 'zip';

/** The user's pick. React's onDownload(document, variant) arguments, as an event payload. */
export interface IDownloadSelection {
  /** The source document. Envelope-level picks with no single source document (zip, or a certificate not yet in documents) leave this undefined. */
  document: IEnvelopeDocument | undefined;
  /** Which download flavor was chosen. */
  variant: TDownloadVariant;
}

/**
 * Download choices for an envelope: each attachment individually, the signing
 * certificate, one combined PDF, or everything as a ZIP. The legacy dialog
 * resolved the file links itself through the API; this port is presentational,
 * so the caller supplies the documents array and fetches the actual file when
 * the download event fires. React's onDownload/onCancel callbacks are the
 * download and cancel emits, with onDownload's two arguments folded into the
 * IDownloadSelection payload.
 */
export interface VerdocsDownloadDialogProps {
  /** The envelope's documents: signer attachments plus the generated certificate. */
  documents?: IEnvelopeDocument[];
  /** True once the envelope is signed. Until then attachments show a busy spinner and the certificate options stay disabled. */
  signed?: boolean;
  /** True while the caller is still polling for generated files; keeps the combined and ZIP options disabled. */
  polling?: boolean;
  /** True when a certificate exists server-side but has not landed in documents yet. */
  hasCertificate?: boolean;
}
</script>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { VerdocsCertificateIcon, VerdocsCheckIcon, VerdocsDocumentIcon, VerdocsRefreshIcon, VerdocsZipIcon } from '../controls/icons';
import VerdocsDialog from './VerdocsDialog.vue';

interface IDownloadRow {
  key: string;
  icon: Component;
  label: string;
  description: string;
  /** Shows the green check plus readyLabel; otherwise a busy spinner. */
  ready: boolean;
  readyLabel: string;
  disabled: boolean;
  disabledTitle?: string;
  document?: IEnvelopeDocument;
  variant: TDownloadVariant;
}

const { documents = [], signed = false, polling = false, hasCertificate = false } = defineProps<VerdocsDownloadDialogProps>();

const emit = defineEmits<{
  /** Fired with the chosen document and variant. */
  download: [selection: IDownloadSelection];
  /** Fired when the user dismisses the dialog via the overlay or the close button. */
  cancel: [];
}>();

const attachments = computed(() =>
  documents
    .filter(doc => doc.type === 'attachment')
    .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.created_at.localeCompare(b.created_at))));

const certificateDocument = computed(() => documents.find(doc => doc.type === 'certificate'));

const certReady = computed(() => signed && (!!certificateDocument.value || hasCertificate));
const allDone = computed(() => !polling && certReady.value);
// Merging needs the certificate document itself, not just the flag saying one exists.
const combinedReady = computed(() => allDone.value && !!certificateDocument.value);

const rows = computed<IDownloadRow[]>(() => {
  const list: IDownloadRow[] = [];

  if (attachments.value.length <= 2) {
    for (const attachment of attachments.value) {
      list.push({
        key: attachment.id,
        icon: VerdocsDocumentIcon,
        label: attachment.name,
        description: 'Download the document',
        ready: signed,
        readyLabel: 'Signed',
        disabled: false,
        document: attachment,
        variant: 'document',
      });
    }
  }

  list.push({
    key: 'certificate',
    icon: VerdocsCertificateIcon,
    label: 'Certificate',
    description: 'Download the certificate',
    ready: certReady.value,
    readyLabel: 'Ready',
    disabled: !certReady.value,
    disabledTitle: 'Certificate not yet available',
    document: certificateDocument.value,
    variant: 'certificate',
  });

  list.push({
    key: 'combined',
    icon: VerdocsZipIcon,
    label: 'Combined',
    description: 'Merge envelopes & certificate into a single PDF',
    ready: combinedReady.value,
    readyLabel: 'Ready',
    disabled: !combinedReady.value,
    disabledTitle: 'Waiting for all documents to be ready',
    document: certificateDocument.value,
    variant: 'combined',
  });

  list.push({
    key: 'zip',
    icon: VerdocsZipIcon,
    label: 'All Files',
    description: 'Download everything as a ZIP file',
    ready: allDone.value,
    readyLabel: 'Ready',
    disabled: !allDone.value,
    disabledTitle: 'Waiting for all documents to be ready',
    document: undefined,
    variant: 'zip',
  });

  return list;
});
</script>

<template>
  <VerdocsDialog
    heading="Download"
    @close="emit('cancel')"
  >
    <div class="vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
      <p
        v-if="attachments.length > 2"
        class="vdocs:m-0 vdocs:px-1 vdocs:text-[13px] vdocs:text-muted vdocs:italic"
      >
        Multiple documents attached. Please use the ZIP option below to download all files.
      </p>

      <button
        v-for="row in rows"
        :key="row.key"
        type="button"
        :disabled="row.disabled"
        :title="row.disabled ? row.disabledTitle : undefined"
        class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-[15px] vdocs:rounded-md vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:px-[15px] vdocs:py-3 vdocs:text-left vdocs:font-sans vdocs:transition-colors vdocs:enabled:hover:border-primary vdocs:enabled:hover:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:opacity-50"
        @click="emit('download', { document: row.document, variant: row.variant })"
      >
        <span class="vdocs:flex vdocs:size-9 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:bg-canvas vdocs:text-muted vdocs:[&>svg]:size-[18px]">
          <component :is="row.icon" />
        </span>

        <span class="vdocs:flex-1">
          <span class="vdocs:mb-0.5 vdocs:block vdocs:text-sm vdocs:font-medium vdocs:text-ink">
            {{ row.label }}
          </span>
          <span class="vdocs:block vdocs:text-[13px] vdocs:text-muted">
            {{ row.description }}
          </span>
        </span>

        <span class="vdocs:flex vdocs:min-w-[50px] vdocs:flex-col vdocs:items-center vdocs:gap-0.5 vdocs:text-[11px] vdocs:text-edge">
          <template v-if="row.ready">
            <VerdocsCheckIcon class="vdocs:size-4 vdocs:text-success" />
            {{ row.readyLabel }}
          </template>
          <VerdocsRefreshIcon
            v-else
            class="vdocs:size-4 vdocs:animate-spin"
          />
        </span>
      </button>
    </div>
  </VerdocsDialog>
</template>
