import { html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import type { ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import { TemplateController, deleteTemplateField, updateTemplateField } from '../store/template-detail.js';
import type { IFieldDeletedDetail, IFieldSettingsChangedDetail } from './template-events.js';
import { helpCircleIcon } from '../controls/icons/index.js';
import { trashIcon } from '../controls/icons/trash-icon.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-select-input.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-checkbox.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-loader.js';

const PANEL_CLASSES = 'vdocs:box-border vdocs:w-80 vdocs:p-5 vdocs:rounded-ctl vdocs:bg-surface vdocs:border vdocs:border-solid ' +
  'vdocs:border-edge-light vdocs:shadow-[2px_2px_10px_0_rgba(0,0,0,0.12)] vdocs:font-sans vdocs:text-ink';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface IOptionRow {
  id: string;
  label: string;
}

const isFilledOption = (option: IOptionRow) => option.id.trim() !== '' || option.label.trim() !== '';

// The options grid always ends with one blank row so there is somewhere to type
// a new entry, mirroring the legacy cleanupOptions behavior.
const withBlankRow = (options: IOptionRow[]): IOptionRow[] => [ ...options.filter(isFilledOption), { id: '', label: '' } ];

/**
 * An edit panel for one template field's settings: name, label, role, required
 * and read-only flags, plus per-type extras (default value and placeholder for
 * text fields, the exclusive-selection group for radio buttons, the options
 * grid for dropdowns). Saves and deletes through the template structure
 * mutations, so the template's detail cache refreshes before the events fire.
 * Mirrors the react-sdk TemplateFieldProperties.
 *
 * The legacy component emitted a role name in its delete event, a leftover from
 * the role properties panel; the port reports the deleted field's name.
 *
 * @fires vdocs-field-settings-changed - Fired with { fieldName, field } after the field's settings save.
 * @fires vdocs-field-deleted - Fired with { templateId, fieldName } after the field is deleted server-side.
 * @fires vdocs-close - Fired when the user cancels, and after a successful save or delete.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if loading or a mutation fails.
 */
export class VdocsTemplateFieldProperties extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    fieldName: { type: String, attribute: 'field-name' },
    helpText: { attribute: false },
    draftName: { state: true },
    draftLabel: { state: true },
    draftRole: { state: true },
    draftRequired: { state: true },
    draftReadOnly: { state: true },
    draftGroup: { state: true },
    draftPlaceholder: { state: true },
    draftDefault: { state: true },
    options: { state: true },
    dirty: { state: true },
    showingHelp: { state: true },
    saving: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The ID of the template the field belongs to. */
  declare templateId: string;
  /** The name of the field to edit. */
  declare fieldName: string;
  /** If set, the panel gets a help view toggled by an icon in its header. Property-only. */
  declare helpText?: TemplateResult;

  private declare draftName: string;
  private declare draftLabel: string;
  private declare draftRole: string;
  private declare draftRequired: boolean;
  private declare draftReadOnly: boolean;
  private declare draftGroup: string;
  private declare draftPlaceholder: string;
  private declare draftDefault: string;
  private declare options: IOptionRow[];
  private declare dirty: boolean;
  private declare showingHelp: boolean;
  private declare saving: boolean;

  private seededFor: string | null = null;

  private query = new TemplateController(
    this,
    () => ({ templateId: this.templateId, endpoint: this.resolvedEndpoint }),
    error => this.reportError(error),
  );

  constructor() {
    super();
    this.templateId = '';
    this.fieldName = '';
    this.draftName = '';
    this.draftLabel = '';
    this.draftRole = '';
    this.draftRequired = false;
    this.draftReadOnly = false;
    this.draftGroup = '';
    this.draftPlaceholder = '';
    this.draftDefault = '';
    this.options = [];
    this.dirty = false;
    this.showingHelp = false;
    this.saving = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override willUpdate(changed: PropertyValues<this>) {
    // Re-seed the draft from the loaded field the first time it arrives and
    // whenever the target field changes, standing in for the react-sdk keying
    // its inner form by field name rather than syncing props to state.
    if (changed.has('fieldName')) {
      this.seededFor = null;
    }

    const field = this.currentField;
    if (field && this.seededFor !== field.name) {
      this.seedDraft(field);
      this.seededFor = field.name;
    }
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get currentField(): ITemplateField | undefined {
    return (this.query.data?.fields || []).find(field => field.name === this.fieldName);
  }

  private seedDraft(field: ITemplateField) {
    this.draftName = field.name;
    this.draftLabel = field.label || '';
    this.draftRole = field.role_name;
    this.draftRequired = !!field.required;
    this.draftReadOnly = !!field.readonly;
    this.draftGroup = field.group || '';
    this.draftPlaceholder = field.placeholder || '';
    this.draftDefault = field.default || '';
    this.options = withBlankRow(field.options || []);
    this.dirty = false;
    this.showingHelp = false;
  }

  private reportError(error: unknown) {
    const err = error as { message: string; response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(err.message, err.response?.status, err.response?.data));
  }

  private async handleSave(field: ITemplateField) {
    const filledOptions = this.options.filter(isFilledOption);

    this.saving = true;
    try {
      const updated = await updateTemplateField(this.resolvedEndpoint, this.templateId, field.name, {
        name: this.draftName,
        role_name: this.draftRole,
        required: this.draftRequired,
        readonly: this.draftReadOnly,
        label: this.draftLabel || null,
        group: this.draftGroup || null,
        placeholder: this.draftPlaceholder || null,
        default: this.draftDefault || null,
        options: filledOptions,
      } as Partial<ITemplateField>);
      this.emit<IFieldSettingsChangedDetail>('vdocs-field-settings-changed', { fieldName: field.name, field: updated });
      this.emit('vdocs-close');
    } catch (error) {
      showToast('Error updating field, please try again later', { style: 'error' });
      this.reportError(error);
    } finally {
      this.saving = false;
    }
  }

  private async handleDelete(field: ITemplateField) {
    this.saving = true;
    try {
      await deleteTemplateField(this.resolvedEndpoint, this.templateId, field.name);
      this.emit<IFieldDeletedDetail>('vdocs-field-deleted', { templateId: this.templateId, fieldName: field.name });
      this.emit('vdocs-close');
    } catch (error) {
      showToast('Error deleting field, please try again later', { style: 'error' });
      this.reportError(error);
    } finally {
      this.saving = false;
    }
  }

  private handleCancel(field: ITemplateField) {
    this.seedDraft(field);
    this.emit('vdocs-close');
  }

  // Apply a draft edit and flag the form dirty, keeping each input handler to a
  // single expression.
  private setDraft(patch: {
    draftName?: string;
    draftLabel?: string;
    draftRole?: string;
    draftRequired?: boolean;
    draftReadOnly?: boolean;
    draftGroup?: string;
    draftPlaceholder?: string;
    draftDefault?: string;
  }) {
    Object.assign(this, patch);
    this.dirty = true;
  }

  private handleOptionChange(index: number, key: 'id' | 'label', value: string) {
    this.options = withBlankRow(this.options.map((option, i) => (i === index ? { ...option, [key]: value } : option)));
    this.dirty = true;
  }

  private handleRemoveOption(index: number) {
    this.options = withBlankRow(this.options.filter((_option, i) => i !== index));
    this.dirty = true;
  }

  override render() {
    if (this.query.isPending) {
      return html`<div class="${PANEL_CLASSES} vdocs:relative vdocs:min-h-40"><vdocs-loader></vdocs-loader></div>`;
    }

    const field = this.currentField;
    // This panel is a companion to larger experiences, so like the legacy
    // component it goes blank rather than erroring when the field is missing.
    if (!field) {
      return nothing;
    }

    const roles = this.query.data?.roles || [];
    const title = `${capitalize(field.type.replace(/_/g, ' '))} Settings`;

    if (this.helpText && this.showingHelp) {
      return html`
        <div class=${PANEL_CLASSES}>
          <h6 class="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
            ${title}
            <span class="vdocs:flex-1"></span>
            <button
              type="button"
              aria-label="Hide help"
              @click=${() => {
                this.showingHelp = false;
              }}
              class="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100">
              ${helpCircleIcon({ className: 'vdocs:size-6' })}
            </button>
          </h6>
          <div class="vdocs:text-sm">${this.helpText}</div>
        </div>`;
    }

    const isTextField = field.type === 'textbox' || field.type === 'textarea';
    const filledOptions = this.options.filter(isFilledOption);
    const saveDisabled = !this.dirty ||
      this.saving ||
      (field.type === 'dropdown' && !filledOptions.length) ||
      (this.draftReadOnly && !this.draftDefault);

    return html`
      <div class=${PANEL_CLASSES}>
        <h6 class="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
          ${title}
          <span class="vdocs:flex-1"></span>
          ${this.helpText ?
            html`
              <button
                type="button"
                aria-label="Show help"
                @click=${() => {
                  this.showingHelp = true;
                }}
                class="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100">
                ${helpCircleIcon({ className: 'vdocs:size-6' })}
              </button>` :
            nothing}
        </h6>

        <vdocs-text-input
          label="Field Name"
          placeholder="Field Name..."
          .value=${this.draftName}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setDraft({ draftName: e.detail.value })}></vdocs-text-input>

        <vdocs-text-input
          label="Optional Label"
          placeholder="Optional Label..."
          .value=${this.draftLabel}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setDraft({ draftLabel: e.detail.value })}></vdocs-text-input>

        <vdocs-select-input
          label="Role"
          .value=${this.draftRole}
          .options=${roles.map(role => ({ label: role.name, value: role.name }))}
          @vdocs-change=${(e: CustomEvent<{ value: string }>) => this.setDraft({ draftRole: e.detail.value })}></vdocs-select-input>

        ${isTextField ?
          html`
            <vdocs-text-input
              label="Default Value"
              placeholder=${this.draftReadOnly && !this.draftDefault ? 'Default value required' : 'Pre-filled value...'}
              .value=${this.draftDefault}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setDraft({ draftDefault: e.detail.value })}></vdocs-text-input>` :
          nothing}

        ${field.type === 'radio' ?
          html`
            <vdocs-text-input
              label="Group"
              placeholder="Group..."
              description="Enable exclusive selections. Only one option within the same group may be selected at a time."
              .value=${this.draftGroup}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) =>
                // Group names are normalized the way the legacy editor did it, so radio buttons grouped across sessions keep matching.
                this.setDraft({ draftGroup: (e.detail.value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') })}></vdocs-text-input>` :
          nothing}

        ${isTextField ?
          html`
            <vdocs-text-input
              label="Placeholder"
              placeholder="Placeholder..."
              .value=${this.draftPlaceholder}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setDraft({ draftPlaceholder: e.detail.value })}></vdocs-text-input>` :
          nothing}

        <div class="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:my-2.5">
          <vdocs-checkbox
            label="Required"
            ?checked=${this.draftRequired}
            @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => this.setDraft({ draftRequired: e.detail.checked })}></vdocs-checkbox>

          <vdocs-checkbox
            label="Read-only"
            ?checked=${this.draftReadOnly}
            @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => this.setDraft({ draftReadOnly: e.detail.checked })}></vdocs-checkbox>
        </div>

        ${field.type === 'dropdown' ?
          html`
            <div class="vdocs:bg-canvas vdocs:rounded-ctl vdocs:p-2.5 vdocs:mt-2.5">
              <div class="vdocs:flex vdocs:gap-2 vdocs:mb-1 vdocs:text-sm vdocs:font-bold">
                <div class="vdocs:flex-1">ID</div>
                <div class="vdocs:flex-1">Label</div>
                <div class="vdocs:w-7"></div>
              </div>

              ${this.options.map((option, index) => html`
                <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:mb-1">
                  <vdocs-text-input
                    placeholder="Unique ID"
                    class="vdocs:flex-1 vdocs:[&_label]:mb-0"
                    .value=${option.id}
                    @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.handleOptionChange(index, 'id', e.detail.value)}></vdocs-text-input>
                  <vdocs-text-input
                    placeholder="Display label"
                    class="vdocs:flex-1 vdocs:[&_label]:mb-0"
                    .value=${option.label}
                    @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.handleOptionChange(index, 'label', e.detail.value)}></vdocs-text-input>
                  <button
                    type="button"
                    aria-label=${`Remove option ${index + 1}`}
                    @click=${() => this.handleRemoveOption(index)}
                    class="vdocs:flex vdocs:size-7 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-ink vdocs:cursor-pointer vdocs:hover:text-danger">
                    ${trashIcon({ className: 'vdocs:size-5' })}
                  </button>
                </div>`)}
            </div>` :
          nothing}

        <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:mt-[30px]">
          <button
            type="button"
            aria-label="Delete field"
            ?disabled=${this.dirty || this.saving}
            @click=${() => this.handleDelete(field)}
            class="vdocs:flex vdocs:size-[34px] vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-danger vdocs:cursor-pointer vdocs:disabled:opacity-40 vdocs:disabled:cursor-default">
            ${trashIcon({ className: 'vdocs:size-5' })}
          </button>
          <div class="vdocs:flex-1"></div>
          <vdocs-button size="small" variant="outline" label="Cancel" ?disabled=${!this.dirty} @click=${() => this.handleCancel(field)}></vdocs-button>
          <vdocs-button size="small" label="Save" ?disabled=${saveDisabled} @click=${() => this.handleSave(field)}></vdocs-button>
        </div>
      </div>`;
  }
}

register('vdocs-template-field-properties', VdocsTemplateFieldProperties);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-field-properties': VdocsTemplateFieldProperties;
  }
}
