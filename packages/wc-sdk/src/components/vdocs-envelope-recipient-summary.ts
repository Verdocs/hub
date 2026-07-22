import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { formatFullName, getRecipientsWithActions, recipientCanAct } from '@verdocs/js-sdk';
import type { IEnvelope, IRecipient, TRecipientStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import { EnvelopeDetailController, getInPersonLink } from '../store/envelopes.js';
import type { IEnvelopeEvent } from './vdocs-envelopes-list.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-component-error.js';
import { showToast } from '../utils/toast.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-button.js';

const STATUS_CLASSES: Partial<Record<TRecipientStatus, string>> = {
  invited: 'vdocs:bg-[#ff8f00]',
  signed: 'vdocs:bg-success',
  submitted: 'vdocs:bg-success',
  pending: 'vdocs:bg-info',
  canceled: 'vdocs:bg-danger',
  declined: 'vdocs:bg-danger',
};

const statusChip = (status: TRecipientStatus): TemplateResult => html`
  <div class="vdocs:min-w-[100px] vdocs:rounded-[5px] vdocs:px-2 vdocs:py-[3px] vdocs:text-center vdocs:text-sm vdocs:capitalize vdocs:text-white ${STATUS_CLASSES[status] ?? 'vdocs:bg-muted'}">
    ${status}
  </div>`;

/**
 * The post-send summary of an envelope's recipients: each role with its current
 * status, plus an in-person signing link fetcher for recipients who can act
 * now. Renders as a plain panel, so hosts that want the modal treatment can
 * wrap it in a vdocs-dialog.
 *
 * @fires vdocs-send-another - Fired with an IEnvelopeEvent when the user clicks Send Another.
 * @fires vdocs-view-envelope - Fired with an IEnvelopeEvent when the user clicks View Now.
 * @fires vdocs-done - Fired with an IEnvelopeEvent when the user clicks Done.
 * @fires vdocs-sdk-error - Fired with an SDKError in detail if an error occurs.
 */
export class VdocsEnvelopeRecipientSummary extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    envelopeId: { type: String, attribute: 'envelope-id' },
    canSendAnother: { type: Boolean, attribute: 'can-send-another' },
    canView: { type: Boolean, attribute: 'can-view' },
    canDone: { type: Boolean, attribute: 'can-done' },
    links: { state: true },
    pendingRole: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The envelope to summarize. */
  declare envelopeId: string;
  /** Enable or disable the Send Another button. */
  declare canSendAnother: boolean;
  /** Enable or disable the View button. */
  declare canView: boolean;
  /** Enable or disable the Done button. */
  declare canDone: boolean;

  private declare links: Record<string, string>;
  private declare pendingRole: string;

  private query = new EnvelopeDetailController(
    this,
    () => ({ envelopeId: this.envelopeId, endpoint: this.resolvedEndpoint }),
    error => this.emitSdkError(error),
  );

  constructor() {
    super();
    this.envelopeId = '';
    this.canSendAnother = true;
    this.canView = true;
    this.canDone = true;
    this.links = {};
    this.pendingRole = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private emitSdkError(error: unknown) {
    const e = error as { message: string; response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(e.message, e.response?.status, e.response?.data));
  }

  private emitEnvelopeEvent(type: `vdocs-${string}`, envelope: IEnvelope) {
    this.emit<IEnvelopeEvent>(type, { endpoint: this.resolvedEndpoint, envelope });
  }

  private handleCopyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => showToast('Link copied to clipboard.', { style: 'success' }))
      .catch(error => {
        showToast('Unable to copy to the clipboard.', { style: 'error' });
        this.emitSdkError(error);
      });
  }

  private async handleGetLink(roleName: string) {
    this.pendingRole = roleName;
    try {
      const response = await getInPersonLink(this.resolvedEndpoint, this.envelopeId, roleName);
      this.links = { ...this.links, [roleName]: response.link };
      this.handleCopyLink(response.link);
    } catch (error) {
      showToast(`Unable to get link: ${(error as Error).message}`, { style: 'error' });
      this.emitSdkError(error);
    } finally {
      this.pendingRole = '';
    }
  }

  private renderRecipient(recipient: IRecipient, recipientsWithActions: IRecipient[]): TemplateResult {
    const showLinkButton = recipientCanAct(recipient, recipientsWithActions);
    const link = this.links[recipient.role_name];
    const gettingLink = this.pendingRole === recipient.role_name;
    const fullName = formatFullName(recipient);

    return html`
      <div class="vdocs:mt-2 vdocs:mb-6 vdocs:flex vdocs:flex-col vdocs:text-muted">
        <div class="vdocs:mb-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
          <div class="vdocs:flex-1 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">${recipient.role_name}</div>
          ${statusChip(recipient.status)}
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-[5px]">
          <div class="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:truncate vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
            ${`${fullName} (${recipient.email || recipient.phone})`}
          </div>
          ${showLinkButton && !link ?
            html`
              <vdocs-button
                size="small"
                variant="outline"
                label="Get Link"
                ?disabled=${gettingLink}
                @click=${() => this.handleGetLink(recipient.role_name)}></vdocs-button>` :
            nothing}
        </div>

        ${link ?
          html`
            <div class="vdocs:mt-1 vdocs:flex vdocs:flex-row vdocs:gap-[5px]">
              <div class="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:overflow-hidden vdocs:truncate vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
                ${link}
              </div>
              <vdocs-button size="small" variant="outline" label="Copy" @click=${() => this.handleCopyLink(link)}></vdocs-button>
            </div>` :
          nothing}
      </div>`;
  }

  override render() {
    // The legacy component rendered nothing while loading. The summary is shown
    // right after a send, so the data is usually already cached anyway.
    if (this.query.isPending) {
      return html``;
    }

    const envelope = this.query.data;
    if (!envelope) {
      return html`<vdocs-component-error message="Unable to load envelope. Please try again later."></vdocs-component-error>`;
    }

    const recipientsWithActions = getRecipientsWithActions(envelope);
    const sortedRecipients = [ ...envelope.recipients ?? [] ].sort((a, b) =>
      (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence));

    return html`
      <div class="vdocs:flex vdocs:w-[600px] vdocs:max-w-full vdocs:flex-col vdocs:rounded-md vdocs:bg-surface vdocs:px-5 vdocs:pt-[30px] vdocs:pb-5 vdocs:font-sans vdocs:box-border">
        <h1 class="vdocs:m-0 vdocs:mb-2.5 vdocs:text-xl vdocs:font-bold vdocs:text-ink">Recipient Summary</h1>

        <div>${sortedRecipients.map(recipient => this.renderRecipient(recipient, recipientsWithActions))}</div>

        ${this.canSendAnother || this.canView || this.canDone ?
          html`
            <div class="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:gap-[15px]">
              ${this.canSendAnother ?
                html`<vdocs-button size="small" label="Send Another" class="vdocs:min-w-[120px]" @click=${() => this.emitEnvelopeEvent('vdocs-send-another', envelope)}></vdocs-button>` :
                nothing}
              ${this.canView ?
                html`<vdocs-button size="small" label="View Now" class="vdocs:min-w-[120px]" @click=${() => this.emitEnvelopeEvent('vdocs-view-envelope', envelope)}></vdocs-button>` :
                nothing}
              ${this.canDone ?
                html`<vdocs-button size="small" label="Done" class="vdocs:min-w-[120px]" @click=${() => this.emitEnvelopeEvent('vdocs-done', envelope)}></vdocs-button>` :
                nothing}
            </div>` :
          nothing}
      </div>`;
  }
}

register('vdocs-envelope-recipient-summary', VdocsEnvelopeRecipientSummary);

// vdocs-view-envelope is declared by vdocs-envelopes-list and vdocs-sdk-error
// by vdocs-auth, both with the same payloads, so only the summary-specific
// events are declared here.
declare global {
  interface HTMLElementTagNameMap {
    'vdocs-envelope-recipient-summary': VdocsEnvelopeRecipientSummary;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-send-another': CustomEvent<IEnvelopeEvent>;
    'vdocs-done': CustomEvent<IEnvelopeEvent>;
  }
}
