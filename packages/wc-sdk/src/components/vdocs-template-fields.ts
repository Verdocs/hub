import { html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { getTemplateDocumentPageDisplayUri } from '@verdocs/js-sdk';
import type { IRole, ITemplateDocument, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import type { IFieldDeletedDetail, IFieldSettingsChangedDetail, ITemplateFieldsEvent } from './template-events.js';
import { TemplateController } from '../store/template-detail.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-component-error.js';
import './vdocs-template-field-properties.js';
import '../fields/vdocs-field-attachment.js';
import '../fields/vdocs-field-signature.js';
import '../fields/vdocs-field-timestamp.js';
import '../fields/vdocs-field-checkbox.js';
import '../fields/vdocs-field-dropdown.js';
import '../fields/vdocs-field-textarea.js';
import './vdocs-template-document-page.js';
import '../fields/vdocs-field-initial.js';
import '../fields/vdocs-field-payment.js';
import '../fields/vdocs-field-textbox.js';
import '../fields/vdocs-field-radio.js';
import '../fields/vdocs-field-date.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-loader.js';
import '../controls/vdocs-portal.js';

const FIELD_ATTRS = 'vdocs:pointer-events-none';
const FIELD_STYLE = 'width: 100%; height: 100%;';

/**
 * The field layout view of the template builder: every page of every document
 * in the template, with the template's fields drawn over them in their stored
 * positions and colored per role. Clicking a field opens
 * vdocs-template-field-properties in a floating panel; saves and deletes go
 * through the template structure mutations, so the canvas refreshes from the
 * updated template. Mirrors the react-sdk TemplateFields.
 *
 * Deviations from the legacy component, per docs/PORTING.md rule 6: interact.js
 * field dragging is not ported, and with it the add-field toolbar and
 * click-to-place mode. Fields are repositioned and created through the API or a
 * future builder embed.
 *
 * @fires vdocs-template-updated - Fired with an ITemplateFieldsEvent in detail when a field is updated or deleted.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if loading or a mutation fails.
 */
export class VdocsTemplateFields extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    selectedField: { state: true },
    // Bumped whenever a page image resolves, to re-render with the new URI.
    pageImageTick: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The ID of the template whose fields are displayed. */
  declare templateId: string;

  private declare selectedField: { name: string; anchor: HTMLElement } | null;
  private declare pageImageTick: number;

  private pageImages = new Map<string, string>();
  private pageImageLoading = new Set<string>();

  private query = new TemplateController(
    this,
    () => ({ templateId: this.templateId, endpoint: this.resolvedEndpoint }),
    error => this.reportError(error),
  );

  constructor() {
    super();
    this.templateId = '';
    this.selectedField = null;
    this.pageImageTick = 0;
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

  // Server-rendered page images, fetched on first use and cached per document
  // page. Mirrors the react-sdk's per-page query (keyed by document id and page).
  private pageImageFor(documentId: string, page: number): string | undefined {
    const key = `${documentId}:${page}`;
    if (this.pageImages.has(key)) {
      return this.pageImages.get(key);
    }

    if (!this.pageImageLoading.has(key)) {
      this.pageImageLoading.add(key);
      getTemplateDocumentPageDisplayUri(this.resolvedEndpoint, documentId, page)
        .then(uri => {
          this.pageImages.set(key, uri);
          this.pageImageLoading.delete(key);
          this.pageImageTick++;
        })
        .catch(() => {
          // Leave the placeholder in place; the loader keeps showing.
          this.pageImageLoading.delete(key);
        });
    }

    return undefined;
  }

  private openField(field: ITemplateField, anchor: HTMLElement) {
    this.selectedField = { name: field.name, anchor };
  }

  private handleSettingsChanged(detail: IFieldSettingsChangedDetail) {
    const template = this.query.data;
    if (!template) {
      return;
    }

    // The legacy templateUpdated event carried a hand-merged copy of the
    // template; the payloads here match it.
    this.emit<ITemplateFieldsEvent>('vdocs-template-updated', {
      endpoint: this.resolvedEndpoint,
      template: { ...template, fields: (template.fields || []).map(field => (field.name === detail.fieldName ? detail.field : field)) },
      event: 'updated-field',
    });
  }

  private handleDelete(detail: IFieldDeletedDetail) {
    this.selectedField = null;
    const template = this.query.data;
    if (!template) {
      return;
    }

    this.emit<ITemplateFieldsEvent>('vdocs-template-updated', {
      endpoint: this.resolvedEndpoint,
      template: { ...template, fields: (template.fields || []).filter(field => field.name !== detail.fieldName) },
      event: 'deleted-field',
    });
  }

  private renderFieldElement(field: ITemplateField, signerIndex: number) {
    // Legacy promoted textboxes carrying a leading setting to textareas, and
    // fell through to the bare field name for unknown types; both are kept.
    const leading = (field.settings as { leading?: number } | null | undefined)?.leading ?? 0;
    const type = field.type === 'textbox' && leading > 0 ? 'textarea' : field.type;

    switch (type) {
      case 'signature':
        return html`<vdocs-field-signature .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-signature>`;
      case 'initial':
        return html`<vdocs-field-initial .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-initial>`;
      case 'textbox':
        return html`<vdocs-field-textbox .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-textbox>`;
      case 'textarea':
        return html`<vdocs-field-textarea .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-textarea>`;
      case 'date':
        return html`<vdocs-field-date .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-date>`;
      case 'timestamp':
        return html`<vdocs-field-timestamp .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-timestamp>`;
      case 'dropdown':
        return html`<vdocs-field-dropdown .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-dropdown>`;
      case 'checkbox':
        return html`<vdocs-field-checkbox .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-checkbox>`;
      case 'radio':
        return html`<vdocs-field-radio .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-radio>`;
      case 'attachment':
        return html`<vdocs-field-attachment .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-attachment>`;
      case 'payment':
        return html`<vdocs-field-payment .field=${field} disabled .signerIndex=${signerIndex} class=${FIELD_ATTRS} style=${FIELD_STYLE}></vdocs-field-payment>`;
      default:
        return field.name;
    }
  }

  private renderPlacedField(field: ITemplateField, signerIndex: number) {
    // Field x/y are PDF points with y measured up from the page bottom; inside
    // the document page's field layer those map straight to left/bottom.
    return html`
      <div
        role="button"
        tabindex="0"
        aria-label=${`${field.name} settings`}
        @click=${(e: MouseEvent) => this.openField(field, e.currentTarget as HTMLElement)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.openField(field, e.currentTarget as HTMLElement);
          }
        }}
        class="vdocs:absolute vdocs:box-border vdocs:cursor-pointer vdocs:outline-offset-2 vdocs:focus-visible:outline-2 vdocs:focus-visible:outline-accent"
        style="left: ${field.x}px; bottom: ${field.y}px; width: ${field.width}px; height: ${field.height}px;">
        ${this.renderFieldElement(field, signerIndex)}
      </div>`;
  }

  private renderPage(document: ITemplateDocument, page: number, fields: ITemplateField[], roles: IRole[]) {
    // Page sizes are keyed by 1-based page number; US Letter when absent.
    const pageSize = document.page_sizes?.[page] || { width: 612, height: 792 };
    const signerIndexFor = (field: ITemplateField) => Math.max(roles.findIndex(role => role.name === field.role_name), 0);

    return html`
      <vdocs-template-document-page
        page-image-uri=${this.pageImageFor(document.id, page) ?? ''}
        virtual-width=${pageSize.width}
        virtual-height=${pageSize.height}
        page-number=${page}
        .content=${html`${fields.map(field => this.renderPlacedField(field, signerIndexFor(field)))}`}></vdocs-template-document-page>`;
  }

  override render() {
    if (this.query.isPending) {
      return html`<div class="vdocs:relative vdocs:min-h-[600px]"><vdocs-loader></vdocs-loader></div>`;
    }

    const template = this.query.data;
    if (!template) {
      return html`<vdocs-component-error message="Unable to load template fields. Please verify you are signed in and try again."></vdocs-component-error>`;
    }

    const documents = template.documents || [];
    const fields = template.fields || [];
    const sortedRoles = [ ...template.roles || [] ].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    return html`
      <div class="vdocs:relative vdocs:font-sans vdocs:min-h-[600px]">
        <div class="vdocs:flex vdocs:flex-col vdocs:items-center vdocs:box-border vdocs:min-h-[200px] vdocs:p-[15px] vdocs:gap-[15px]">
          ${documents.map(document => html`
            <div class="vdocs:w-full vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
              ${documents.length > 1 ?
                html`<div class="vdocs:box-border vdocs:w-full vdocs:rounded-md vdocs:bg-ink vdocs:text-white vdocs:text-base vdocs:font-medium vdocs:px-5 vdocs:py-3">${document.name}</div>` :
                nothing}

              ${Array.from({ length: document.pages || 0 }, (_unused, index) => index + 1).map(page =>
                this.renderPage(document, page, fields.filter(field => field.document_id === document.id && field.page === page), sortedRoles))}
            </div>`)}

          ${!documents.length ?
            html`<div class="vdocs:text-lg vdocs:text-muted vdocs:py-20">This template does not have any documents yet.</div>` :
            nothing}
        </div>

        ${this.selectedField ?
            keyed(this.selectedField.name, html`
            <vdocs-portal .anchor=${this.selectedField.anchor} @vdocs-click-away=${() => {
              this.selectedField = null;
            }}>
              <vdocs-template-field-properties
                template-id=${this.templateId}
                field-name=${this.selectedField.name}
                .endpoint=${this.endpoint}
                @vdocs-close=${() => {
                  this.selectedField = null;
                }}
                @vdocs-field-settings-changed=${(e: CustomEvent<IFieldSettingsChangedDetail>) => {
                  e.stopPropagation();
                  this.handleSettingsChanged(e.detail);
                }}
                @vdocs-field-deleted=${(e: CustomEvent<IFieldDeletedDetail>) => {
                  e.stopPropagation();
                  this.handleDelete(e.detail);
                }}
                @vdocs-sdk-error=${(e: CustomEvent<SDKError>) => {
                  e.stopPropagation();
                  this.emit('vdocs-sdk-error', e.detail);
                }}></vdocs-template-field-properties>
            </vdocs-portal>`) :
          nothing}
      </div>`;
  }
}

register('vdocs-template-fields', VdocsTemplateFields);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-fields': VdocsTemplateFields;
  }
}
