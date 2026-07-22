import { html } from 'lit';
import { live } from 'lit/directives/live.js';
import type { IRecipient, IUpdateRecipientParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { EnvelopeDetailController, updateRecipient } from '../store/envelopes.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-text-input.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-button.js';
import '../dialogs/vdocs-dialog.js';

/**
 * A dialog for updating a recipient's contact details (name, email, phone, and
 * invite message) before they act. Only the fields that actually changed are
 * submitted, and the envelope's detail query is invalidated after a save so any
 * mounted views refresh. Mount it to show it; the host removes it in
 * vdocs-updated / vdocs-cancel.
 *
 * @fires vdocs-updated - Fired with the updated IRecipient after a successful save.
 * @fires vdocs-cancel - Fired when the user dismisses the dialog without saving any changes.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if an error occurs.
 */
export class VdocsEnvelopeUpdateRecipient extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    envelopeId: { type: String, attribute: 'envelope-id' },
    roleName: { type: String, attribute: 'role-name' },
    firstName: { state: true },
    lastName: { state: true },
    email: { state: true },
    phone: { state: true },
    message: { state: true },
    saving: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The envelope containing the recipient to update. */
  declare envelopeId: string;
  /** The role name of the recipient to update. */
  declare roleName: string;

  // Edit buffers overlay the loaded recipient: null means untouched, so the
  // form tracks the server data until the user starts typing in a field.
  private declare firstName: string | null;
  private declare lastName: string | null;
  private declare email: string | null;
  private declare phone: string | null;
  private declare message: string | null;
  private declare saving: boolean;

  private query = new EnvelopeDetailController(
    this,
    () => ({ envelopeId: this.envelopeId, endpoint: this.resolvedEndpoint }),
    error => this.emitSdkError(error),
  );

  constructor() {
    super();
    this.envelopeId = '';
    this.roleName = '';
    this.firstName = null;
    this.lastName = null;
    this.email = null;
    this.phone = null;
    this.message = null;
    this.saving = false;
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get recipient(): IRecipient | undefined {
    return (this.query.data?.recipients ?? []).find(r => r.role_name === this.roleName);
  }

  private emitSdkError(error: unknown) {
    const e = error as { message: string; response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(e.message, e.response?.status, e.response?.data));
  }

  private async handleSave() {
    const recipient = this.recipient;
    if (!recipient) {
      return;
    }

    const fields: IUpdateRecipientParams = {};
    if (this.firstName !== null && this.firstName !== recipient.first_name) {
      fields.first_name = this.firstName;
    }
    if (this.lastName !== null && this.lastName !== recipient.last_name) {
      fields.last_name = this.lastName;
    }
    if (this.email !== null && this.email !== recipient.email) {
      fields.email = this.email;
    }
    if (this.phone !== null && this.phone !== (recipient.phone ?? '')) {
      fields.phone = this.phone;
    }
    if (this.message !== null && this.message !== (recipient.message ?? '')) {
      fields.message = this.message;
    }

    // Nothing changed, so skip the request. The server sends a fresh invite on
    // some updates and we don't want to trigger that for a no-op save.
    if (Object.keys(fields).length < 1) {
      this.emit('vdocs-cancel');
      return;
    }

    this.saving = true;
    try {
      const updated = await updateRecipient(this.resolvedEndpoint, this.envelopeId, this.roleName, fields);
      showToast('Recipient updated', { style: 'success' });
      this.emit<IRecipient>('vdocs-updated', updated);
    } catch (error) {
      showToast(`Error updating recipient: ${(error as Error).message}`, { style: 'error' });
      this.emitSdkError(error);
    } finally {
      this.saving = false;
    }
  }

  override render() {
    const recipient = this.recipient;

    // The legacy component rendered nothing until the envelope loaded, to avoid
    // flashing an empty dialog.
    if (!recipient) {
      return html``;
    }

    const footer = html`
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
        <vdocs-button label="Cancel" variant="outline" size="small" ?disabled=${this.saving} @click=${() => this.emit('vdocs-cancel')}></vdocs-button>
        <vdocs-button label="Save" size="small" ?disabled=${this.saving} @click=${() => this.handleSave()}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog heading="Update Recipient" .footer=${footer} @vdocs-close=${() => this.emit('vdocs-cancel')}>
        <div class="vdocs:mb-2 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">${this.roleName}</div>

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-3">
          <vdocs-text-input
            class="vdocs:flex-1"
            placeholder="First Name..."
            .value=${this.firstName ?? recipient.first_name ?? ''}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.firstName = e.detail.value;
            }}></vdocs-text-input>
          <vdocs-text-input
            class="vdocs:flex-1"
            placeholder="Last Name..."
            .value=${this.lastName ?? recipient.last_name ?? ''}
            @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
              this.lastName = e.detail.value;
            }}></vdocs-text-input>
        </div>

        <vdocs-text-input
          type="email"
          placeholder="Email Address..."
          .value=${this.email ?? recipient.email ?? ''}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
            this.email = e.detail.value;
          }}></vdocs-text-input>

        <vdocs-text-input
          type="tel"
          placeholder="Phone Number..."
          .value=${this.phone ?? recipient.phone ?? ''}
          @vdocs-input=${(e: CustomEvent<{ value: string }>) => {
            this.phone = e.detail.value;
          }}></vdocs-text-input>

        <textarea
          rows="3"
          aria-label="Invitation Message"
          placeholder="Optional message to include in invitation..."
          data-lpignore="true"
          .value=${live(this.message ?? recipient.message ?? '')}
          @input=${(e: Event) => {
            this.message = (e.target as HTMLTextAreaElement).value;
          }}
          class="vdocs:box-border vdocs:w-full vdocs:resize-y vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface vdocs:p-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none vdocs:focus:border-accent"></textarea>

        <div class="vdocs:mt-2 vdocs:text-sm vdocs:italic vdocs:text-muted">
          NOTE: If you change the recipient's email address or invite message, they will receive a new
          invitation to sign the envelope. This will also reset their status if they have previously
          declined to sign.
        </div>
      </vdocs-dialog>`;
  }
}

register('vdocs-envelope-update-recipient', VdocsEnvelopeUpdateRecipient);

// vdocs-cancel and vdocs-sdk-error are already declared elsewhere (dialogs and
// vdocs-auth) with the same payloads, so only vdocs-updated is declared here.
declare global {
  interface HTMLElementTagNameMap {
    'vdocs-envelope-update-recipient': VdocsEnvelopeUpdateRecipient;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-updated': CustomEvent<IRecipient>;
  }
}
