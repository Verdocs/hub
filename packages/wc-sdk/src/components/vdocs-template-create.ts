import { html, nothing } from 'lit';
import type { ITemplate, ITemplateCreateParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { createTemplate } from '../store/template-detail.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-file-chooser.js';
import '../controls/vdocs-text-input.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-spinner.js';
import '../controls/vdocs-button.js';

// Matches the legacy web-sdk limit: the API caps creation requests at 20MB, and
// the extra half-megabyte leaves room for the multipart framing around the files.
const DEFAULT_MAX_SIZE = 20.5 * 1024 * 1024;

/**
 * Upload one or more documents and create a new template from them, typically
 * the first step in a template creation workflow. When vdocs-template-created
 * fires, the host usually routes to its template editor. Mirrors the react-sdk
 * TemplateCreate.
 *
 * @fires vdocs-template-created - Fired with the new template in detail once it is created.
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if creation fails.
 */
export class VdocsTemplateCreate extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    maxSize: { type: Number, attribute: 'max-size' },
    files: { state: true },
    name: { state: true },
    nameEdited: { state: true },
    submitting: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** Maximum combined size of the uploaded documents, in bytes. Defaults to roughly 20MB. */
  declare maxSize: number;

  private declare files: File[];
  private declare name: string;
  private declare nameEdited: boolean;
  private declare submitting: boolean;

  constructor() {
    super();
    this.maxSize = DEFAULT_MAX_SIZE;
    this.files = [];
    this.name = '';
    this.nameEdited = false;
    this.submitting = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get totalSize() {
    return this.files.reduce((total, file) => total + file.size, 0);
  }

  private get sizeError() {
    return this.totalSize > this.maxSize ? 'Total file size must not exceed 20MB.' : '';
  }

  private get submitDisabled() {
    return !this.files.length || !this.name.trim() || !!this.sizeError || this.submitting;
  }

  private handleSelectFiles(files: File[]) {
    this.files = files;

    // A new selection suggests a template name, but never over a name the user typed.
    const first = files[0];
    if (!this.nameEdited && first) {
      this.name = first.name;
    }
  }

  private handleNameInput(value: string) {
    this.name = value;
    this.nameEdited = true;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.submitDisabled) {
      return;
    }

    this.submitting = true;
    try {
      const params = { name: this.name.trim(), documents: this.files } as ITemplateCreateParams;
      const template = await createTemplate(this.resolvedEndpoint, params);
      this.emit<ITemplate>('vdocs-template-created', template);
    } catch (error) {
      const err = error as Error & { response?: { status?: number; data?: unknown } };
      this.emit('vdocs-sdk-error', new SDKError(err.message, err.response?.status, err.response?.data));
    } finally {
      this.submitting = false;
    }
  }

  override render() {
    return html`
      <form autocomplete="off" @submit=${this.handleSubmit} class="vdocs:flex vdocs:flex-col vdocs:p-3 vdocs:bg-surface vdocs:font-sans">
        <vdocs-text-input
          required
          label="Name"
          placeholder="Template Name..."
          .value=${this.name}
          ?disabled=${this.submitting}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.handleNameInput(e.detail.value)}></vdocs-text-input>

        <div class=${this.submitting ? 'vdocs:pointer-events-none vdocs:opacity-50' : ''}>
          <vdocs-file-chooser
            multiple
            @vdocs-select-files=${(e: CustomEvent<{ files: File[] }>) => this.handleSelectFiles(e.detail.files)}></vdocs-file-chooser>
        </div>

        ${this.sizeError ? html`<div class="vdocs:mt-4 vdocs:text-sm vdocs:text-danger">${this.sizeError}</div>` : nothing}

        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2 vdocs:mt-4">
          ${this.submitting ?
            html`
              <vdocs-spinner mode="dark" size="24"></vdocs-spinner>
              <div class="vdocs:text-sm vdocs:text-muted">Creating template...</div>` :
            nothing}

          <div class="vdocs:flex-1"></div>

          <vdocs-button
            size="small"
            label="Cancel"
            variant="outline"
            ?disabled=${this.submitting}
            @click=${() => this.emit('vdocs-cancel')}></vdocs-button>

          <vdocs-button size="small" type="submit" label="Create" ?disabled=${this.submitDisabled}></vdocs-button>
        </div>
      </form>`;
  }
}

register('vdocs-template-create', VdocsTemplateCreate);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-create': VdocsTemplateCreate;
  }
}
