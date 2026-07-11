import { html, nothing } from 'lit';
import type { ITemplateDocument, VerdocsEndpoint } from '@verdocs/js-sdk';
import { docFileIcon, genericFileIcon, jpgFileIcon, pdfFileIcon, pngFileIcon } from '../controls/icons/file-type-icons.js';
import { TemplateController, createTemplateDocument, deleteTemplateDocument } from '../store/template-detail.js';
import { pageCountIcon } from '../controls/icons/page-count-icon.js';
import { trashIcon } from '../controls/icons/trash-icon.js';
import { SDKError, type ITemplateEvent } from '../types.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-component-error.js';
import '../controls/vdocs-file-chooser.js';
import '../controls/vdocs-progress-bar.js';
import '../dialogs/vdocs-ok-dialog.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-loader.js';

const fileTypeIcon = (mime: string) => {
  switch (mime) {
    case 'application/pdf':
      return pdfFileIcon();
    case 'image/jpeg':
      return jpgFileIcon();
    case 'image/png':
      return pngFileIcon();
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return docFileIcon();
    default:
      return genericFileIcon();
  }
};

/**
 * Display a template's attached documents and let the user add or remove them.
 * Uploads report progress while the server ingests the file; deletions are
 * confirmed first because they also remove any fields placed on the document.
 * Mirrors the react-sdk TemplateAttachments.
 *
 * @fires vdocs-attachments-changed - Fired with an ITemplateEvent in detail after an attachment is added or removed.
 * @fires vdocs-attachments-next - Fired with an ITemplateEvent in detail when the user clicks Next (react-sdk's onNext).
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if loading or a mutation fails.
 */
export class VdocsTemplateAttachments extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    progress: { state: true },
    confirmingDelete: { state: true },
    showDeleteError: { state: true },
    uploading: { state: true },
    deleting: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The template ID to edit. */
  declare templateId: string;

  private declare progress: { label: string; percent: number };
  private declare confirmingDelete: ITemplateDocument | null;
  private declare showDeleteError: boolean;
  private declare uploading: boolean;
  private declare deleting: boolean;

  private query = new TemplateController(
    this,
    () => ({ templateId: this.templateId, endpoint: this.resolvedEndpoint }),
    error => this.reportError(error),
  );

  constructor() {
    super();
    this.templateId = '';
    this.progress = { label: 'Uploading...', percent: 0 };
    this.confirmingDelete = null;
    this.showDeleteError = false;
    this.uploading = false;
    this.deleting = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private reportError(error: unknown) {
    const err = error as Error & { response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(err.message, err.response?.status, err.response?.data));
  }

  private notifyChanged() {
    // The mutations' refetch is awaited before this runs, so the controller
    // already holds the refreshed template.
    const fresh = this.query.data;
    if (fresh) {
      this.emit<ITemplateEvent>('vdocs-attachments-changed', { endpoint: this.resolvedEndpoint, template: fresh });
    }
  }

  private handleUploadProgress(percent: number) {
    // The server keeps rasterizing pages after the last byte lands, so we hold
    // at 100% with a different label instead of appearing stuck.
    this.progress = percent >= 99 ? { label: 'Processing...', percent: 100 } : { label: 'Uploading...', percent };
  }

  private async handleSelectFiles(files: File[]) {
    const file = files[0];
    if (!file) {
      return;
    }

    this.progress = { label: 'Uploading...', percent: 0 };
    this.uploading = true;
    try {
      await createTemplateDocument(this.resolvedEndpoint, this.templateId, file, percent => this.handleUploadProgress(percent));
      this.notifyChanged();
    } catch (error) {
      this.reportError(error);
    } finally {
      this.uploading = false;
    }
  }

  private handleDelete(doc: ITemplateDocument) {
    if ((this.query.data?.documents || []).length > 1) {
      this.confirmingDelete = doc;
    } else {
      this.showDeleteError = true;
    }
  }

  private async handleConfirmDelete() {
    const doc = this.confirmingDelete;
    this.confirmingDelete = null;
    if (!doc) {
      return;
    }

    this.deleting = true;
    try {
      await deleteTemplateDocument(this.resolvedEndpoint, doc.id, this.templateId);
      this.notifyChanged();
    } catch (error) {
      this.reportError(error);
    } finally {
      this.deleting = false;
    }
  }

  private renderRow(doc: ITemplateDocument) {
    return html`
      <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-4 vdocs:py-1 vdocs:text-muted">
        ${fileTypeIcon(doc.mime)}

        <div title=${doc.name} class="vdocs:flex-1 vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:border-b vdocs:border-dotted vdocs:border-edge-light">
          ${doc.name}
        </div>

        <div class="vdocs:relative vdocs:size-6 vdocs:shrink-0" title=${`${doc.pages} page(s)`}>
          ${pageCountIcon({ className: 'vdocs:absolute vdocs:top-0 vdocs:left-0' })}
          <div class="vdocs:absolute vdocs:top-[11px] vdocs:left-[3px] vdocs:z-10 vdocs:w-[18px] vdocs:text-center vdocs:text-xs vdocs:font-medium vdocs:tracking-[-2px]">
            ${doc.pages}
          </div>
        </div>

        <button
          type="button"
          aria-label=${`Delete ${doc.name}`}
          ?disabled=${this.deleting}
          @click=${() => this.handleDelete(doc)}
          class="vdocs:flex vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-muted vdocs:opacity-40 vdocs:hover:opacity-100 vdocs:hover:text-danger">
          ${trashIcon({ className: 'vdocs:size-6' })}
        </button>
      </div>`;
  }

  override render() {
    if (this.query.error) {
      return html`<vdocs-component-error message="Unable to load this template. Please try again later."></vdocs-component-error>`;
    }

    if (!this.query.data) {
      return html`
        <div class="vdocs:max-w-[600px]">
          ${Array.from({ length: 3 }, () => html`<div class="vdocs:h-10 vdocs:my-2.5 vdocs:rounded-ctl vdocs:bg-canvas vdocs:animate-pulse"></div>`)}
        </div>`;
    }

    const template = this.query.data;
    const documents = template.documents || [];

    return html`
      <div class="vdocs:max-w-[600px] vdocs:font-sans vdocs:text-ink">
        <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">Existing Attachments</h5>

        <div class="vdocs:mb-10">${documents.map(doc => this.renderRow(doc))}</div>

        <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">Attach a New Document</h5>

        ${this.uploading ?
          html`
            <div class="vdocs:relative vdocs:box-border vdocs:flex vdocs:h-80 vdocs:w-80 vdocs:flex-col vdocs:justify-end vdocs:border-2 vdocs:border-dashed vdocs:border-edge vdocs:bg-canvas">
              <vdocs-loader></vdocs-loader>
              <div class="vdocs:p-5">
                <vdocs-progress-bar show-percent .percent=${this.progress.percent} label=${this.progress.label}></vdocs-progress-bar>
              </div>
            </div>` :
          html`
            <div class="vdocs:my-2.5 vdocs:border-2 vdocs:border-dashed vdocs:border-edge">
              <vdocs-file-chooser @vdocs-select-files=${(e: CustomEvent<{ files: File[] }>) => this.handleSelectFiles(e.detail.files)}></vdocs-file-chooser>
            </div>`}

        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-end vdocs:gap-2 vdocs:mt-4">
          <vdocs-button variant="outline" label="Cancel" size="small" ?disabled=${this.uploading} @click=${() => this.emit('vdocs-cancel')}></vdocs-button>
          <vdocs-button
            label="Next"
            size="small"
            ?disabled=${!documents.length || this.uploading}
            @click=${() => this.emit<ITemplateEvent>('vdocs-attachments-next', { endpoint: this.resolvedEndpoint, template })}></vdocs-button>
        </div>

        ${this.showDeleteError ?
          html`
            <vdocs-ok-dialog
              heading="Unable to Delete Attachment"
              message="Templates must contain at least one attachment."
              @vdocs-ok=${() => {
                this.showDeleteError = false;
              }}
              @vdocs-cancel=${() => {
                this.showDeleteError = false;
              }}></vdocs-ok-dialog>` :
          nothing}

        ${this.confirmingDelete ?
          html`
            <vdocs-ok-dialog
              heading="Delete this Attachment?"
              message="This operation cannot be undone. All fields placed on the deleted attachment will also be removed."
              show-cancel
              @vdocs-ok=${this.handleConfirmDelete}
              @vdocs-cancel=${() => {
                this.confirmingDelete = null;
              }}></vdocs-ok-dialog>` :
          nothing}
      </div>`;
  }
}

register('vdocs-template-attachments', VdocsTemplateAttachments);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-attachments': VdocsTemplateAttachments;
  }
}
