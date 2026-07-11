import { html, nothing } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-file-chooser.js';
import '../controls/vdocs-button.js';
import './dialog-events.js';
import './vdocs-dialog.js';

const DEFAULT_ACCEPT = '.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

const MB = 1024 * 1024;

/**
 * Prompts the user to pick one or more files to attach. Nothing is
 * transmitted: the chosen files are handed to the host through vdocs-upload,
 * and the host performs the actual upload and removes the dialog. Purely
 * presentational; mount it conditionally like the other dialogs.
 *
 * React prop mapping: accept and multiple are the same-named attributes, and
 * maxSize is max-size.
 *
 * @fires vdocs-upload - Fired with the chosen files in detail.files when the user clicks Upload (React's onUpload).
 * @fires vdocs-cancel - Fired when the user clicks Cancel, the close button, or the background overlay (React's onCancel).
 */
export class VdocsUploadDialog extends VdocsElement {
  static override properties = {
    accept: { type: String },
    multiple: { type: Boolean },
    maxSize: { type: Number, attribute: 'max-size' },
    files: { state: true },
  };

  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF, Word, and image files. */
  declare accept: string;
  /** If set, the user may choose more than one file. */
  declare multiple: boolean;
  /** Maximum total size of the selected files, in bytes. Defaults to 20MB. */
  declare maxSize: number;

  private declare files: File[];

  constructor() {
    super();
    this.accept = DEFAULT_ACCEPT;
    this.multiple = false;
    this.maxSize = 20 * MB;
    this.files = [];
  }

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleCancel = () => {
    this.emit('vdocs-cancel');
  };

  private handleUpload = () => {
    this.emit('vdocs-upload', { files: this.files });
  };

  private handleSelectFiles = (e: CustomEvent<{ files: File[] }>) => {
    // The composed picker's event is an implementation detail; the dialog's
    // public contract is vdocs-upload.
    e.stopPropagation();
    this.files = e.detail.files;
  };

  override render() {
    const totalSize = this.files.reduce((acc, file) => acc + file.size, 0);
    const tooBig = totalSize > this.maxSize;

    // The legacy dialog hard-coded "20MB" in this message even when maxSize
    // was customized; we derive the label from the actual limit instead.
    const limitLabel = this.maxSize >= MB ? `${Math.round(this.maxSize / MB * 10) / 10}MB` : `${Math.round(this.maxSize / 1024)}KB`;

    const footer = html`
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-4">
        <vdocs-button label="Cancel" variant="outline" @click=${this.handleCancel}></vdocs-button>
        <vdocs-button label="Upload" .disabled=${tooBig || this.files.length < 1} @click=${this.handleUpload}></vdocs-button>
      </div>`;

    // The dashed frame preserves the legacy drop-target affordance around the
    // shared picker.
    return html`
      <vdocs-dialog heading="Upload attachment" .footer=${footer} @vdocs-close=${this.handleClose}>
        <div class="vdocs:rounded-ctl vdocs:border-2 vdocs:border-dashed vdocs:border-edge">
          <vdocs-file-chooser accept=${this.accept} ?multiple=${this.multiple} @vdocs-select-files=${this.handleSelectFiles}></vdocs-file-chooser>
        </div>

        ${tooBig ? html`<div class="vdocs:mt-4 vdocs:text-sm vdocs:text-danger">Total file size must not exceed ${limitLabel}.</div>` : nothing}
      </vdocs-dialog>`;
  }
}

register('vdocs-upload-dialog', VdocsUploadDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-upload-dialog': VdocsUploadDialog;
  }
}
