import { html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { formatFullName } from '@verdocs/js-sdk';
import type { IRole, VerdocsEndpoint } from '@verdocs/js-sdk';
import { TemplateController, createTemplateRole } from '../store/template-detail.js';
import type { IRoleDeletedDetail, IRolesUpdatedEvent } from './template-events.js';
import { circleCheckIcon, envelopeIcon } from '../controls/icons/index.js';
import { pencilIcon } from '../controls/icons/pencil-icon.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { cogIcon } from '../controls/icons/cog-icon.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-component-error.js';
import './vdocs-template-role-properties.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-portal.js';

const sortRoles = (roles: IRole[]) => [ ...roles ].sort((a, b) => (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence));

// Role names are UGC and can be anything, so the generated name has to dodge
// whatever already exists, not just count upward.
const nextRoleName = (roles: IRole[]) => {
  let nextNumber = roles.length;
  let name = '';
  do {
    nextNumber++;
    name = `Recipient ${nextNumber}`;
  } while (roles.some(role => role.name === name));

  return name;
};

const roleTypeIcon = (type: IRole['type']) => {
  if (type === 'cc') {
    return envelopeIcon({ className: 'vdocs:size-5 vdocs:opacity-60' });
  }
  if (type === 'approver') {
    return circleCheckIcon({ className: 'vdocs:size-5 vdocs:opacity-60' });
  }
  return pencilIcon({ className: 'vdocs:size-5 vdocs:opacity-60' });
};

/**
 * Display a template's signing workflow as sequence-ordered rows of role chips.
 * Roles at the same sequence number act in parallel; each row has an add button,
 * and a trailing row adds a new sequence step. Clicking a chip's icon opens the
 * role editor in a floating panel. Mirrors the react-sdk TemplateRoles.
 *
 * @fires vdocs-roles-updated - Fired with an IRolesUpdatedEvent in detail when a role is added or deleted.
 * @fires vdocs-roles-next - Fired (no payload) when the user clicks OK to proceed (react-sdk's onNext).
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if loading or a mutation fails.
 */
export class VdocsTemplateRoles extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    editing: { state: true },
    creating: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The template ID to edit. */
  declare templateId: string;

  private declare editing: { roleName: string; anchor: HTMLElement } | null;
  private declare creating: boolean;

  private query = new TemplateController(
    this,
    () => ({ templateId: this.templateId, endpoint: this.resolvedEndpoint }),
    error => this.reportError(error),
  );

  constructor() {
    super();
    this.templateId = '';
    this.editing = null;
    this.creating = false;
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

  private notifyRolesUpdated(event: IRolesUpdatedEvent['event']) {
    // The role mutations' cache refresh is awaited before this runs, so our
    // controller already holds the refreshed template.
    const fresh = this.query.data;
    this.emit<IRolesUpdatedEvent>('vdocs-roles-updated', {
      endpoint: this.resolvedEndpoint,
      templateId: this.templateId,
      event,
      roles: sortRoles(fresh?.roles || []),
    });
  }

  private async handleAddRole(sequence: number, sortedRoles: IRole[], atSequence: number) {
    this.creating = true;
    try {
      await createTemplateRole(this.resolvedEndpoint, this.templateId, {
        template_id: this.templateId,
        name: nextRoleName(sortedRoles),
        type: 'signer',
        sequence,
        order: atSequence + 1,
        full_name: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
        delegator: false,
        name_locked: false,
      } as IRole);
      this.notifyRolesUpdated('added');
    } catch (error) {
      this.reportError(error);
    } finally {
      this.creating = false;
    }
  }

  private handleCloseEditor() {
    this.editing = null;
  }

  private handleRoleDeleted() {
    this.editing = null;
    this.notifyRolesUpdated('deleted');
  }

  private renderChip(role: IRole) {
    // Roles with complete contact info are "known" and display as people; the
    // rest are placeholders filled in when each envelope is created.
    const unknown = !role.email || !role.first_name || !role.last_name;

    return html`
      <div class="vdocs:relative vdocs:box-border vdocs:flex vdocs:h-8 vdocs:max-w-[200px] vdocs:flex-col vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-info/10 vdocs:pl-[34px] vdocs:pr-3.5">
        <div class="vdocs:overflow-hidden vdocs:text-sm vdocs:font-normal vdocs:leading-[30px] vdocs:whitespace-nowrap vdocs:text-ellipsis">
          ${unknown ? role.name : formatFullName(role)}
        </div>

        <button
          type="button"
          aria-label=${`Edit role ${role.name}`}
          @click=${(e: MouseEvent) => {
            this.editing = { roleName: role.name, anchor: e.currentTarget as HTMLElement };
          }}
          class="vdocs:group vdocs:absolute vdocs:left-1 vdocs:top-1 vdocs:flex vdocs:size-6 vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-ink/60">
          <span class="vdocs:flex vdocs:group-hover:hidden vdocs:group-focus:hidden">${roleTypeIcon(role.type)}</span>
          <span class="vdocs:hidden vdocs:group-hover:flex vdocs:group-focus:flex">${cogIcon({ className: 'vdocs:size-5' })}</span>
        </button>
      </div>`;
  }

  private renderAddButton(onClick: () => void) {
    return html`
      <button
        type="button"
        ?disabled=${this.creating}
        @click=${onClick}
        class="vdocs:h-8 vdocs:px-2.5 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:cursor-pointer vdocs:opacity-40 vdocs:hover:opacity-100 vdocs:disabled:opacity-20 vdocs:disabled:cursor-default">
        + Add Role
      </button>`;
  }

  override render() {
    if (this.query.error) {
      return html`<vdocs-component-error message="Unable to load this template. Please try again later."></vdocs-component-error>`;
    }

    if (!this.query.data) {
      return html`
        <div class="vdocs:max-w-[600px] vdocs:p-3">
          ${Array.from({ length: 3 }, () => html`<div class="vdocs:h-10 vdocs:my-2.5 vdocs:rounded-ctl vdocs:bg-canvas vdocs:animate-pulse"></div>`)}
        </div>`;
    }

    const sortedRoles = sortRoles(this.query.data.roles || []);
    const sequences = [ ...new Set(sortedRoles.map(role => role.sequence)) ];
    const nextSequence = sequences.length > 0 ? (sequences[sequences.length - 1] || 0) + 1 : 1;
    const rolesAtSequence = (sequence: number) => sortedRoles.filter(role => role.sequence === sequence);
    const editingRole = this.editing ? sortedRoles.find(role => role.name === this.editing?.roleName) : undefined;

    return html`
      <form
        autocomplete="off"
        @submit=${(e: Event) => e.preventDefault()}
        class="vdocs:flex vdocs:flex-col vdocs:max-w-[600px] vdocs:p-3 vdocs:bg-canvas vdocs:font-sans vdocs:text-ink">
        <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">Roles and Workflow</h5>

        <div class="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:mt-2.5">
          ${sequences.map((sequence, index) => html`
            <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:pb-2 vdocs:font-medium vdocs:border-b vdocs:border-dotted vdocs:border-edge-light">
              <div class="vdocs:text-lg vdocs:leading-8">${index + 1}.</div>
              <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5">${rolesAtSequence(sequence).map(role => this.renderChip(role))}</div>
              ${this.renderAddButton(() => this.handleAddRole(sequence, sortedRoles, rolesAtSequence(sequence).length))}
            </div>`)}

          <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:pb-2 vdocs:font-medium vdocs:text-muted vdocs:border-b vdocs:border-dotted vdocs:border-edge-light">
            <div class="vdocs:text-lg vdocs:leading-8">${sequences.length + 1}.</div>
            ${this.renderAddButton(() => this.handleAddRole(nextSequence, sortedRoles, 0))}
          </div>
        </div>

        ${sortedRoles.length < 1 ?
          html`
            <div class="vdocs:text-[13px] vdocs:mt-4 vdocs:mb-1">
              You must add at least one Role before proceeding. Click the + Add Role button above to get started.
            </div>` :
          nothing}

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
          <div class="vdocs:flex vdocs:flex-1"></div>
          <vdocs-button variant="outline" label="Cancel" size="small" @click=${() => this.emit('vdocs-cancel')}></vdocs-button>
          <vdocs-button label="OK" size="small" ?disabled=${sortedRoles.length < 1} @click=${() => this.emit('vdocs-roles-next')}></vdocs-button>
        </div>
      </form>

      ${this.editing && editingRole ?
          keyed(this.editing.roleName, html`
          <vdocs-portal .anchor=${this.editing.anchor} @vdocs-click-away=${this.handleCloseEditor}>
            <vdocs-template-role-properties
              .endpoint=${this.endpoint}
              template-id=${this.templateId}
              .templateRole=${editingRole}
              @vdocs-close=${this.handleCloseEditor}
              @vdocs-role-deleted=${(e: CustomEvent<IRoleDeletedDetail>) => {
                e.stopPropagation();
                this.handleRoleDeleted();
              }}
              @vdocs-sdk-error=${(e: CustomEvent<SDKError>) => {
                e.stopPropagation();
                this.emit('vdocs-sdk-error', e.detail);
              }}></vdocs-template-role-properties>
          </vdocs-portal>`) :
        nothing}`;
  }
}

register('vdocs-template-roles', VdocsTemplateRoles);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-roles': VdocsTemplateRoles;
  }
}
