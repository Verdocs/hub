import { html, nothing } from 'lit';
import { isValidEmail } from '@verdocs/js-sdk';
import type { IRole, TRecipientType, VerdocsEndpoint } from '@verdocs/js-sdk';
import { TemplateController, deleteTemplateRole, updateTemplateRole } from '../store/template-detail.js';
import type { ISelectOption } from '../controls/vdocs-select-input.js';
import type { IRoleDeletedDetail } from './template-events.js';
import { trashIcon } from '../controls/icons/trash-icon.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-select-input.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-help-icon.js';
import '../controls/vdocs-checkbox.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-button.js';

const TypeOptions: ISelectOption[] = [
  { label: 'Signer', value: 'signer' },
  { label: 'CC', value: 'cc' },
  { label: 'Approver', value: 'approver' },
];

/** Pending form edits, layered over the role prop. An empty object means the form is clean. */
interface IRoleEdits {
  name?: string;
  type?: TRecipientType;
  sequence?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  delegator?: boolean;
}

/**
 * An editing panel for a single template role: its name, type, signing
 * sequence, default contact info, and delegation setting. Typically composed by
 * vdocs-template-roles inside a portal, but it can be hosted anywhere a role and
 * template ID are in hand. Mirrors the react-sdk TemplateRoleProperties.
 *
 * The react-sdk's `role` prop is exposed here as the `templateRole` property:
 * `role` reflects the ARIA role on every HTMLElement, so a reactive property of
 * that name cannot carry an IRole. The compact contact-info inputs identify
 * themselves by placeholder rather than an aria-label (the react-sdk used
 * aria-label; vdocs-text-input exposes only a visible label), so they read as
 * First..., Last..., and so on.
 *
 * @fires vdocs-close - Fired when the panel should close, after a save or when the user dismisses it.
 * @fires vdocs-role-deleted - Fired with { templateId, roleName } after the role is deleted server-side.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if a save or delete fails.
 */
export class VdocsTemplateRoleProperties extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    templateRole: { attribute: false },
    edits: { state: true },
    busy: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The template ID the role belongs to. */
  declare templateId: string;
  /** The role to edit. Property-only. Mirrors the react-sdk's `role` prop (renamed off the reserved ARIA `role`). */
  declare templateRole?: IRole;

  private declare edits: IRoleEdits;
  private declare busy: boolean;

  // Only needed to know whether fields reference this role; roles are renameable
  // until fields point at them by name.
  private query = new TemplateController(this, () => ({ templateId: this.templateId, endpoint: this.resolvedEndpoint }));

  constructor() {
    super();
    this.templateId = '';
    this.edits = {};
    this.busy = false;
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

  private setEdit(edit: IRoleEdits) {
    this.edits = { ...this.edits, ...edit };
  }

  private reportError(error: unknown) {
    const err = error as Error & { response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(err.message, err.response?.status, err.response?.data));
  }

  private async handleSave(role: IRole) {
    const name = this.edits.name ?? role.name;
    const type = this.edits.type ?? role.type;
    const sequence = this.edits.sequence ?? role.sequence;
    const firstName = this.edits.first_name ?? role.first_name ?? '';
    const lastName = this.edits.last_name ?? role.last_name ?? '';
    const email = this.edits.email ?? role.email ?? '';
    const phone = this.edits.phone ?? role.phone ?? '';
    const delegator = this.edits.delegator ?? role.delegator ?? false;

    this.busy = true;
    try {
      await updateTemplateRole(this.resolvedEndpoint, this.templateId, role.name, {
        name,
        type,
        sequence,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        delegator,
      });
      this.edits = {};
      this.emit('vdocs-close');
    } catch (error) {
      this.reportError(error);
    } finally {
      this.busy = false;
    }
  }

  private async handleDelete(role: IRole) {
    if (!window.confirm('Are you sure you wish to remove this role? All associated fields will be removed as well. This action cannot be undone.')) {
      return;
    }

    this.busy = true;
    try {
      await deleteTemplateRole(this.resolvedEndpoint, this.templateId, role.name);
      this.emit<IRoleDeletedDetail>('vdocs-role-deleted', { templateId: this.templateId, roleName: role.name });
      this.emit('vdocs-close');
    } catch (error) {
      this.reportError(error);
    } finally {
      this.busy = false;
    }
  }

  override render() {
    const role = this.templateRole;
    if (!role) {
      return nothing;
    }

    const name = this.edits.name ?? role.name;
    const type = this.edits.type ?? role.type;
    const sequence = this.edits.sequence ?? role.sequence;
    const firstName = this.edits.first_name ?? role.first_name ?? '';
    const lastName = this.edits.last_name ?? role.last_name ?? '';
    const email = this.edits.email ?? role.email ?? '';
    const phone = this.edits.phone ?? role.phone ?? '';
    const delegator = this.edits.delegator ?? role.delegator ?? false;

    const hasFields = (this.query.data?.fields || []).some(field => field.role_name === role.name);

    // Contact info is all-or-nothing: leave it blank to fill in at send time, or
    // supply a complete first/last/email set for a "known" role.
    const isValid = (!email && !firstName && !lastName) || (isValidEmail(email) && !!firstName && !!lastName);

    return html`
      <form
        autocomplete="off"
        @submit=${(e: Event) => e.preventDefault()}
        class="vdocs:box-border vdocs:flex vdocs:w-80 vdocs:flex-col vdocs:gap-[15px] vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:p-5 vdocs:font-sans vdocs:text-ink vdocs:shadow-lg">
        <div>
          <vdocs-text-input
            label="Role Name (Must be unique)"
            placeholder="Role Name..."
            class="vdocs:[&_label]:mb-0"
            ?disabled=${hasFields}
            .value=${name}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ name: e.detail.value })}></vdocs-text-input>
          ${hasFields ?
            html`<div class="vdocs:mt-[7px] vdocs:text-xs vdocs:italic">This role has fields assigned and can no longer be renamed.</div>` :
            nothing}
        </div>

        <vdocs-select-input
          label="Type"
          class="vdocs:[&_label]:mb-0"
          .value=${type}
          .options=${TypeOptions}
          @vdocs-change=${(e: CustomEvent<{ value: string }>) => this.setEdit({ type: e.detail.value as TRecipientType })}></vdocs-select-input>

        <vdocs-text-input
          label="Sequence"
          type="number"
          class="vdocs:[&_label]:mb-0"
          description="Roles sharing a sequence number act in parallel; higher numbers act later."
          .value=${String(sequence)}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ sequence: Math.max(1, Math.floor(+e.detail.value || 1)) })}></vdocs-text-input>

        <div>
          <div class="vdocs:mb-1 vdocs:text-sm vdocs:font-bold vdocs:text-muted">Default Contact Info:</div>

          <div class="vdocs:flex vdocs:flex-row vdocs:gap-[15px]">
            <vdocs-text-input
              placeholder="First..."
              class="vdocs:[&_label]:mb-0"
              .value=${firstName}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ first_name: e.detail.value })}></vdocs-text-input>

            <vdocs-text-input
              placeholder="Last..."
              class="vdocs:[&_label]:mb-0"
              .value=${lastName}
              @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ last_name: e.detail.value })}></vdocs-text-input>
          </div>
        </div>

        <vdocs-text-input
          placeholder="Email Address..."
          class="vdocs:[&_label]:mb-0"
          .value=${email}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ email: e.detail.value })}></vdocs-text-input>

        <vdocs-text-input
          placeholder="Phone Number..."
          class="vdocs:[&_label]:mb-0"
          .value=${phone}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => this.setEdit({ phone: e.detail.value })}></vdocs-text-input>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
          <vdocs-checkbox
            label="May Delegate"
            ?checked=${delegator}
            @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => this.setEdit({ delegator: e.detail.checked })}></vdocs-checkbox>
          <vdocs-help-icon text="If enabled, this recipient may delegate their actions to another individual."></vdocs-help-icon>
        </div>

        <div class="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-between">
          <button
            type="button"
            aria-label="Delete Role"
            ?disabled=${this.dirty || this.busy}
            @click=${() => this.handleDelete(role)}
            class="vdocs:flex vdocs:h-[34px] vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:px-1.5 vdocs:text-danger vdocs:active:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:text-disabled">
            ${trashIcon({ className: 'vdocs:size-6' })}
          </button>

          <vdocs-button
            size="small"
            label="Save"
            ?disabled=${!this.dirty || !isValid || this.busy}
            @click=${() => this.handleSave(role)}></vdocs-button>
        </div>
      </form>`;
  }
}

register('vdocs-template-role-properties', VdocsTemplateRoleProperties);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-role-properties': VdocsTemplateRoleProperties;
  }
}
