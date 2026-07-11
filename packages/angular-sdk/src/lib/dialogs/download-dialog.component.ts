import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { VerdocsDialogComponent } from './dialog.component';

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

interface IDownloadRow {
  key: string;
  icon: 'document' | 'certificate' | 'zip';
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

/**
 * Download choices for an envelope: each attachment individually, the signing
 * certificate, one combined PDF, or everything as a ZIP. The legacy dialog
 * resolved the file links itself through the API; this port is presentational,
 * so the caller supplies the documents array and fetches the actual file when
 * the download event fires. React's onDownload/onCancel callbacks are this
 * component's download and cancel outputs, with onDownload's two arguments
 * folded into the IDownloadSelection payload.
 */
@Component({
  selector: 'verdocs-download-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent ],
  template: `
    <verdocs-dialog heading="Download" (closed)="cancel.emit()">
      <div class="vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
        @if (attachments().length > 2) {
          <p class="vdocs:m-0 vdocs:px-1 vdocs:text-[13px] vdocs:text-muted vdocs:italic">
            Multiple documents attached. Please use the ZIP option below to download all files.
          </p>
        }

        @for (row of rows(); track row.key) {
          <button
            type="button"
            [disabled]="row.disabled"
            [attr.title]="row.disabled ? row.disabledTitle : null"
            (click)="download.emit({ document: row.document, variant: row.variant })"
            class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-[15px] vdocs:rounded-md vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:px-[15px] vdocs:py-3 vdocs:text-left vdocs:font-sans vdocs:transition-colors vdocs:enabled:hover:border-primary vdocs:enabled:hover:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:opacity-50">
            <span class="vdocs:flex vdocs:size-9 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:bg-canvas vdocs:text-muted">
              @switch (row.icon) {
                @case ('document') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="vdocs:size-[18px]" aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 2V9H20" />
                  </svg>
                }
                @case ('certificate') {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="vdocs:size-[18px]" aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" />
                  </svg>
                }
                @default {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="vdocs:size-[18px]" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 16V22H14V16" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 16H18" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 22H4" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10L12 16" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12L12 16L16 12" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16V4H20V16" />
                  </svg>
                }
              }
            </span>

            <span class="vdocs:flex-1">
              <span class="vdocs:mb-0.5 vdocs:block vdocs:text-sm vdocs:font-medium vdocs:text-ink">{{ row.label }}</span>
              <span class="vdocs:block vdocs:text-[13px] vdocs:text-muted">{{ row.description }}</span>
            </span>

            <span class="vdocs:flex vdocs:min-w-[50px] vdocs:flex-col vdocs:items-center vdocs:gap-0.5 vdocs:text-[11px] vdocs:text-edge">
              @if (row.ready) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="vdocs:size-4 vdocs:text-success"
                  aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {{ row.readyLabel }}
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="vdocs:size-4 vdocs:animate-spin" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 4V10H17" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.49 15A9 9 0 1 1 21.23 8" />
                </svg>
              }
            </span>
          </button>
        }
      </div>
    </verdocs-dialog>
  `,
})
export class VerdocsDownloadDialogComponent {
  /** The envelope's documents: signer attachments plus the generated certificate. */
  readonly documents = input<IEnvelopeDocument[]>([]);
  /** True once the envelope is signed. Until then attachments show a busy spinner and the certificate options stay disabled. */
  readonly signed = input(false);
  /** True while the caller is still polling for generated files; keeps the combined and ZIP options disabled. */
  readonly polling = input(false);
  /** True when a certificate exists server-side but has not landed in documents yet. */
  readonly hasCertificate = input(false);

  /** Emitted with the chosen document and variant. */
  readonly download = output<IDownloadSelection>();
  /** Emitted when the user dismisses the dialog via the overlay or the close button. */
  readonly cancel = output<void>();

  protected readonly attachments = computed(() =>
    this.documents()
      .filter(document => document.type === 'attachment')
      .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.created_at.localeCompare(b.created_at))));

  private readonly certificateDocument = computed(() => this.documents().find(document => document.type === 'certificate'));

  private readonly certReady = computed(() => this.signed() && (!!this.certificateDocument() || this.hasCertificate()));
  private readonly allDone = computed(() => !this.polling() && this.certReady());
  // Merging needs the certificate document itself, not just the flag saying one exists.
  private readonly combinedReady = computed(() => this.allDone() && !!this.certificateDocument());

  protected readonly rows = computed<IDownloadRow[]>(() => {
    const attachments = this.attachments();
    const certificateDocument = this.certificateDocument();
    const certReady = this.certReady();
    const allDone = this.allDone();
    const combinedReady = this.combinedReady();

    const rows: IDownloadRow[] = attachments.length <= 2 ?
        attachments.map(document => ({
          key: document.id,
          icon: 'document' as const,
          label: document.name,
          description: 'Download the document',
          ready: this.signed(),
          readyLabel: 'Signed',
          disabled: false,
          document,
          variant: 'document' as const,
        })) :
        [];

    rows.push(
      {
        key: 'certificate',
        icon: 'certificate',
        label: 'Certificate',
        description: 'Download the certificate',
        ready: certReady,
        readyLabel: 'Ready',
        disabled: !certReady,
        disabledTitle: 'Certificate not yet available',
        document: certificateDocument,
        variant: 'certificate',
      },
      {
        key: 'combined',
        icon: 'zip',
        label: 'Combined',
        description: 'Merge envelopes & certificate into a single PDF',
        ready: combinedReady,
        readyLabel: 'Ready',
        disabled: !combinedReady,
        disabledTitle: 'Waiting for all documents to be ready',
        document: certificateDocument,
        variant: 'combined',
      },
      {
        key: 'zip',
        icon: 'zip',
        label: 'All Files',
        description: 'Download everything as a ZIP file',
        ready: allDone,
        readyLabel: 'Ready',
        disabled: !allDone,
        disabledTitle: 'Waiting for all documents to be ready',
        document: undefined,
        variant: 'zip',
      },
    );

    return rows;
  });
}
