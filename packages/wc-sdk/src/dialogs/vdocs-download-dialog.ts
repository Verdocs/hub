import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import { certificateIcon, checkIcon, documentIcon, refreshIcon, zipIcon } from '../controls/icons/index.js';
import type { IDownloadSelection, TDownloadVariant } from './dialog-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import './vdocs-dialog.js';

interface IDownloadOption {
  icon: TemplateResult;
  label: string;
  description: string;
  /** Shows the green check plus readyLabel; otherwise a busy spinner. */
  ready: boolean;
  readyLabel: string;
  disabled?: boolean;
  disabledTitle?: string;
  onSelect: () => void;
}

/**
 * Download choices for an envelope: each attachment individually, the signing
 * certificate, one combined PDF, or everything as a ZIP. The legacy dialog
 * resolved the file links itself through the API; this port is
 * presentational, so the host supplies the documents array and fetches the
 * actual file when vdocs-download fires.
 *
 * React prop mapping: documents is a property-only array, signed and polling
 * are the same-named attributes, and hasCertificate is has-certificate.
 *
 * @fires vdocs-download - Fired with the chosen IDownloadSelection in detail. Envelope-level picks with no single source
 * document pass detail.document as undefined (React's onDownload).
 * @fires vdocs-cancel - Fired when the user dismisses the dialog via the overlay or the close button (React's onCancel).
 */
export class VdocsDownloadDialog extends VdocsElement {
  static override properties = {
    documents: { attribute: false },
    signed: { type: Boolean },
    polling: { type: Boolean },
    hasCertificate: { type: Boolean, attribute: 'has-certificate' },
  };

  /** The envelope's documents: signer attachments plus the generated certificate. Property-only. */
  declare documents: IEnvelopeDocument[];
  /** True once the envelope is signed. Until then attachments show a busy spinner and the certificate options stay disabled. */
  declare signed: boolean;
  /** True while the host is still polling for generated files; keeps the combined and ZIP options disabled. */
  declare polling: boolean;
  /** True when a certificate exists server-side but has not landed in documents yet. */
  declare hasCertificate: boolean;

  constructor() {
    super();
    this.documents = [];
    this.signed = false;
    this.polling = false;
    this.hasCertificate = false;
  }

  private handleClose = (e: Event) => {
    // The base dialog's vdocs-close is an implementation detail of this
    // composition; the public dismissal contract is vdocs-cancel.
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private select(document: IEnvelopeDocument | undefined, variant: TDownloadVariant) {
    this.emit<IDownloadSelection>('vdocs-download', { document, variant });
  }

  private renderOption(option: IDownloadOption) {
    return html`
      <button
        type="button"
        ?disabled=${option.disabled}
        title=${option.disabled && option.disabledTitle ? option.disabledTitle : nothing}
        @click=${option.onSelect}
        class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-[15px] vdocs:rounded-md vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:px-[15px] vdocs:py-3 vdocs:text-left vdocs:font-sans vdocs:transition-colors vdocs:enabled:hover:border-primary vdocs:enabled:hover:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:opacity-50">
        <span class="vdocs:flex vdocs:size-9 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:bg-canvas vdocs:text-muted vdocs:[&>svg]:size-[18px]">
          ${option.icon}
        </span>

        <span class="vdocs:flex-1">
          <span class="vdocs:mb-0.5 vdocs:block vdocs:text-sm vdocs:font-medium vdocs:text-ink">${option.label}</span>
          <span class="vdocs:block vdocs:text-[13px] vdocs:text-muted">${option.description}</span>
        </span>

        <span class="vdocs:flex vdocs:min-w-[50px] vdocs:flex-col vdocs:items-center vdocs:gap-0.5 vdocs:text-[11px] vdocs:text-edge">
          ${option.ready ?
            html`
              ${checkIcon({ className: 'vdocs:size-4 vdocs:text-success' })}
              ${option.readyLabel}` :
              refreshIcon({ className: 'vdocs:size-4 vdocs:animate-spin' })}
        </span>
      </button>`;
  }

  override render() {
    const attachments = this.documents
      .filter(document => document.type === 'attachment')
      .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.created_at.localeCompare(b.created_at)));
    const certificateDocument = this.documents.find(document => document.type === 'certificate');

    const certReady = this.signed && (!!certificateDocument || this.hasCertificate);
    const allDone = !this.polling && certReady;
    // Merging needs the certificate document itself, not just the flag saying
    // one exists.
    const combinedReady = allDone && !!certificateDocument;

    return html`
      <vdocs-dialog heading="Download" @vdocs-close=${this.handleClose}>
        <div class="vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
          ${attachments.length <= 2 ?
              attachments.map(document => this.renderOption({
                icon: documentIcon(),
                label: document.name,
                description: 'Download the document',
                ready: this.signed,
                readyLabel: 'Signed',
                onSelect: () => this.select(document, 'document'),
              })) :
            html`
              <p class="vdocs:m-0 vdocs:px-1 vdocs:text-[13px] vdocs:text-muted vdocs:italic">
                Multiple documents attached. Please use the ZIP option below to download all files.
              </p>`}

          ${this.renderOption({
            icon: certificateIcon(),
            label: 'Certificate',
            description: 'Download the certificate',
            ready: certReady,
            readyLabel: 'Ready',
            disabled: !certReady,
            disabledTitle: 'Certificate not yet available',
            onSelect: () => this.select(certificateDocument, 'certificate'),
          })}

          ${this.renderOption({
            icon: zipIcon(),
            label: 'Combined',
            description: 'Merge envelopes & certificate into a single PDF',
            ready: combinedReady,
            readyLabel: 'Ready',
            disabled: !combinedReady,
            disabledTitle: 'Waiting for all documents to be ready',
            onSelect: () => this.select(certificateDocument, 'combined'),
          })}

          ${this.renderOption({
            icon: zipIcon(),
            label: 'All Files',
            description: 'Download everything as a ZIP file',
            ready: allDone,
            readyLabel: 'Ready',
            disabled: !allDone,
            disabledTitle: 'Waiting for all documents to be ready',
            onSelect: () => this.select(undefined, 'zip'),
          })}
        </div>
      </vdocs-dialog>`;
  }
}

register('vdocs-download-dialog', VdocsDownloadDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-download-dialog': VdocsDownloadDialog;
  }
}
