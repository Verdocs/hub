import { html, nothing } from 'lit';
import type { ITemplateCreateParams, TTemplateSender, TTemplateVisibility, VerdocsEndpoint } from '@verdocs/js-sdk';
import { TemplateController, updateTemplate } from '../store/template-detail.js';
import type { ISelectOption } from '../controls/vdocs-select-input.js';
import { SDKError, type ITemplateEvent } from '../types.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-component-error.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-select-input.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-switch.js';

// The server stores reminder delays in milliseconds; the form edits them in days.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const VisibilityOptions: ISelectOption[] = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'public', label: 'Public' },
];

const SenderOptions: ISelectOption[] = [
  { value: 'envelope_creator', label: 'Envelope Creator' },
  { value: 'template_owner', label: 'Template Owner' },
];

/** Pending form edits, layered over the server copy. An empty object means the form is clean. */
interface ITemplateSettingsEdits {
  name?: string;
  visibility?: TTemplateVisibility;
  sender?: TTemplateSender;
  sendReminders?: boolean;
  initialReminderDays?: number;
  followupReminderDays?: number;
}

/**
 * An edit form for a template's basic settings: name, visibility, envelope
 * ownership, and signing reminders. Values load from the template detail query
 * and save through a single update call. Mirrors the react-sdk TemplateSettings.
 *
 * @fires vdocs-settings-changed - Fired with an ITemplateEvent in detail after the settings save.
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if loading or saving fails.
 */
export class VdocsTemplateSettings extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    edits: { state: true },
    saving: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The template ID to edit. */
  declare templateId: string;

  private declare edits: ITemplateSettingsEdits;
  private declare saving: boolean;

  private query = new TemplateController(
    this,
    () => ({ templateId: this.templateId, endpoint: this.resolvedEndpoint }),
    error => this.reportError(error),
  );

  constructor() {
    super();
    this.templateId = '';
    this.edits = {};
    this.saving = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get dirty() {
    return Object.keys(this.edits).length > 0;
  }

  private reportError(error: unknown) {
    const err = error as { message: string; response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(err.message, err.response?.status, err.response?.data));
  }

  private setEdit(edit: ITemplateSettingsEdits) {
    this.edits = { ...this.edits, ...edit };
  }

  private async handleSave() {
    const template = this.query.data;
    if (!template) {
      return;
    }

    const name = this.edits.name ?? template.name;
    const visibility = this.edits.visibility ?? template.visibility ?? 'private';
    const sender = this.edits.sender ?? template.sender;
    const sendReminders = this.edits.sendReminders ?? !!template.initial_reminder;
    const initialReminderDays = this.edits.initialReminderDays ?? (template.initial_reminder ? Math.floor(template.initial_reminder / MS_PER_DAY) : 0);
    const followupReminderDays = this.edits.followupReminderDays ?? (template.followup_reminders ? Math.floor(template.followup_reminders / MS_PER_DAY) : 0);

    // The create/update params type declares the reminder fields as numbers, but
    // the API uses null to disable reminders (and the legacy component sent null),
    // so we cast to keep the wire payload identical.
    const params = {
      name,
      visibility,
      sender,
      initial_reminder: sendReminders ? initialReminderDays * MS_PER_DAY : null,
      followup_reminders: sendReminders ? followupReminderDays * MS_PER_DAY : null,
    } as Partial<ITemplateCreateParams>;

    this.saving = true;
    try {
      const updated = await updateTemplate(this.resolvedEndpoint, this.templateId, params);
      this.edits = {};
      this.emit<ITemplateEvent>('vdocs-settings-changed', { endpoint: this.resolvedEndpoint, template: updated });
    } catch (error) {
      const err = error as Error & { response?: { status?: number; data?: { error?: string } } };
      this.reportError(err);
      showToast(err.response?.data?.error || 'Error updating template, please try again later.', { style: 'error' });
    } finally {
      this.saving = false;
    }
  }

  override render() {
    if (this.query.error) {
      return html`<vdocs-component-error message="Unable to load this template. Please try again later."></vdocs-component-error>`;
    }

    const template = this.query.data;
    if (!template) {
      return html`
        <div class="vdocs:max-w-[600px] vdocs:p-3">
          ${Array.from({ length: 5 }, () => html`<div class="vdocs:h-10 vdocs:my-2.5 vdocs:rounded-ctl vdocs:bg-canvas vdocs:animate-pulse"></div>`)}
        </div>`;
    }

    const name = this.edits.name ?? template.name;
    const visibility = this.edits.visibility ?? template.visibility ?? 'private';
    const sender = this.edits.sender ?? template.sender ?? 'envelope_creator';
    const sendReminders = this.edits.sendReminders ?? !!template.initial_reminder;
    const initialReminderDays = this.edits.initialReminderDays ?? (template.initial_reminder ? Math.floor(template.initial_reminder / MS_PER_DAY) : 0);
    const followupReminderDays = this.edits.followupReminderDays ?? (template.followup_reminders ? Math.floor(template.followup_reminders / MS_PER_DAY) : 0);

    return html`
      <form
        autocomplete="off"
        @submit=${(e: Event) => e.preventDefault()}
        class="vdocs:flex vdocs:flex-col vdocs:max-w-[600px] vdocs:p-3 vdocs:bg-canvas vdocs:font-sans vdocs:text-ink">
        <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">Settings</h5>

        <div class="vdocs:mt-5">
          <vdocs-text-input
            label="Template Name"
            placeholder="Template Name..."
            .value=${name}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ name: e.detail.value })}></vdocs-text-input>
        </div>

        <div class="vdocs:mt-5">
          <vdocs-select-input
            label="Visibility"
            .value=${visibility}
            .options=${VisibilityOptions}
            @vdocs-change=${(e: CustomEvent<{ value: string }>) => this.setEdit({ visibility: e.detail.value as TTemplateVisibility })}></vdocs-select-input>
        </div>

        <div class="vdocs:mt-5">
          <vdocs-select-input
            label="Owner for envelopes created from this template"
            .value=${sender}
            .options=${SenderOptions}
            @vdocs-change=${(e: CustomEvent<{ value: string }>) => this.setEdit({ sender: e.detail.value as TTemplateSender })}></vdocs-select-input>
        </div>

        <div class="vdocs:mt-5">
          <vdocs-switch
            label="Send Reminders"
            ?checked=${sendReminders}
            @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => this.setEdit({ sendReminders: e.detail.checked })}></vdocs-switch>
        </div>

        ${sendReminders ?
          html`
            <div class="vdocs:mt-5">
              <vdocs-text-input
                label="First Reminder (days)"
                type="number"
                placeholder="Delay in days..."
                .value=${String(initialReminderDays)}
                @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ initialReminderDays: Math.max(0, Math.floor(+e.detail.value || 0)) })}></vdocs-text-input>
            </div>
            <div class="vdocs:mt-5">
              <vdocs-text-input
                label="Follow-up Reminders (days)"
                type="number"
                placeholder="Delay in days..."
                .value=${String(followupReminderDays)}
                @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ followupReminderDays: Math.max(0, Math.floor(+e.detail.value || 0)) })}></vdocs-text-input>
            </div>` :
          nothing}

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
          <vdocs-button variant="outline" label="Cancel" size="small" @click=${() => this.emit('vdocs-cancel')}></vdocs-button>
          <vdocs-button label="Save" size="small" ?disabled=${!this.dirty || this.saving} @click=${this.handleSave}></vdocs-button>
        </div>
      </form>`;
  }
}

register('vdocs-template-settings', VdocsTemplateSettings);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-settings': VdocsTemplateSettings;
  }
}
