import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import './vdocs-button.js';

const DEFAULT_ACCEPT = 'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Displays a file picker to upload an attachment: a drag-and-drop target plus
 * a click-to-browse button. This component is just the picker; the host
 * application provides the actual upload functionality. React's onSelectFiles
 * callback is this element's vdocs-select-files event, fired with
 * `{ files: File[] }` in detail. The list is empty when the selection is
 * cleared, e.g. while the user is choosing a different file; hosts should use
 * it to enable/disable buttons that upload or otherwise process the selection.
 *
 * @fires vdocs-select-files - Fired when the selection changes, with the selected files in detail.
 */
export class VdocsFileChooser extends VdocsElement {
  static override properties = {
    accept: { type: String },
    multiple: { type: Boolean },
    files: { state: true },
    dragging: { state: true },
  };

  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF and Word documents. */
  declare accept: string;
  /** If set, the user may choose more than one file. */
  declare multiple: boolean;

  private declare files: File[];
  private declare dragging: boolean;

  constructor() {
    super();
    this.accept = DEFAULT_ACCEPT;
    this.multiple = false;
    this.files = [];
    this.dragging = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private applySelection(selected: File[]) {
    this.files = selected;
    this.emit('vdocs-select-files', { files: selected });
  }

  private handleFilesChanged(e: Event) {
    this.applySelection(Array.from((e.target as HTMLInputElement).files ?? []));
  }

  private handleBrowse() {
    // The selection resets before the dialog opens so hosts can disable their upload buttons
    // while a new pick is pending. Clearing the input's value also means re-picking the same
    // file still fires a change event.
    this.applySelection([]);
    const input = this.querySelector<HTMLInputElement>('input[type="file"]');
    if (input) {
      input.value = '';
      input.click();
    }
  }

  private handleDragOver(e: DragEvent) {
    // preventDefault marks the box as a valid drop target; without it the browser opens the file.
    e.preventDefault();
    this.dragging = true;
  }

  private handleDragLeave(e: DragEvent) {
    // dragleave also fires when the cursor moves over child nodes; only clear the highlight
    // when the cursor actually left the box.
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      this.dragging = false;
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;

    // The accept attribute only filters the browse dialog; browsers don't enforce it on drops.
    // Hosts validate file types when they process the upload anyway.
    const dropped = Array.from(e.dataTransfer?.files ?? []);
    if (dropped.length) {
      this.applySelection(this.multiple ? dropped : dropped.slice(0, 1));
    }
  }

  override render() {
    return html`
      <div
        class="vdocs:flex vdocs:flex-col vdocs:box-border vdocs:font-sans vdocs:text-center vdocs:text-muted vdocs:bg-surface vdocs:rounded-ctl vdocs:px-4 vdocs:py-10 ${this.dragging ? 'vdocs:outline-2 vdocs:outline-dashed vdocs:outline-accent' : ''}"
        @drop=${this.handleDrop}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}>
        <input
          type="file"
          accept=${this.accept}
          ?multiple=${this.multiple}
          aria-label="Select a file"
          class="vdocs:sr-only"
          @change=${this.handleFilesChanged} />

        <div class="vdocs:text-xl vdocs:font-bold vdocs:wrap-anywhere">
          ${this.files.length ? this.files.map(file => file.name).join(', ') : 'Drag a file here'}
        </div>

        <div class="vdocs:h-5 vdocs:my-5 vdocs:text-base">${this.files.length ? '' : 'Or, if you prefer...'}</div>

        <vdocs-button
          size="small"
          .label=${this.files.length ? 'Select a different file' : 'Select a file from your computer'}
          @click=${this.handleBrowse}></vdocs-button>
      </div>`;
  }
}

register('vdocs-file-chooser', VdocsFileChooser);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-file-chooser': VdocsFileChooser;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-select-files': CustomEvent<{ files: File[] }>;
  }
}
