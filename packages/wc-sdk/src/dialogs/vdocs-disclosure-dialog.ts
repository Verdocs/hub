import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { checkIcon } from '../controls/icons/index.js';
import { register } from '../base/register.js';
import '../controls/vdocs-checkbox.js';
import '../controls/vdocs-button.js';
import './dialog-events.js';
import './vdocs-dialog.js';

const disclosureLink = (href: string, label: string) => html`<a href=${href} target="_blank" rel="noreferrer" class="vdocs:text-accent">${label}</a>`;

const disclosureItem = (content: TemplateResult) => html`
  <li class="vdocs:relative vdocs:mb-3 vdocs:pl-[34px] vdocs:text-sm vdocs:leading-5">
    ${checkIcon({ className: 'vdocs:absolute vdocs:-top-0.5 vdocs:left-0 vdocs:size-6 vdocs:text-muted' })}
    ${content}
  </li>`;

// Mirrors DEFAULT_DISCLOSURES in js-sdk, which the platform only overrides at
// the organization level. Callers with custom disclosures pass their own
// template through the disclosures property.
const DEFAULT_DISCLOSURE_CONTENT = html`
  <ul class="vdocs:m-0 vdocs:mb-4 vdocs:list-none vdocs:p-0">
    ${disclosureItem(html`Agree to use electronic records and signatures, and confirm you have read the
      ${disclosureLink('https://verdocs.com/en/electronic-record-signature-disclosure/', 'Electronic Record and Signatures Disclosure')}.`)}
    ${disclosureItem(html`Agree to Verdocs' ${disclosureLink('https://verdocs.com/en/eula', 'End User License Agreement')} and confirm you
      have read Verdocs' ${disclosureLink('https://verdocs.com/en/privacy-policy/', 'Privacy Policy')}.`)}
  </ul>`;

/**
 * The e-signature disclosures and consent gate shown before signing begins.
 * Proceed stays disabled until the signer checks the acceptance box; Decline
 * (and Delegate, when enabled) are always available. Purely presentational:
 * the host records the outcome when an event fires.
 *
 * React prop mapping: disclosures is a property-only TemplateResult
 * (defaults to the standard Verdocs disclosures), and delegator is the
 * same-named attribute.
 *
 * @fires vdocs-agree - Fired when the user accepts the disclosures and chooses to proceed (React's onAgree).
 * @fires vdocs-decline - Fired when the user declines to sign (React's onDecline).
 * @fires vdocs-delegate - Fired bare when the user chooses to delegate signing. Only reachable when delegator is set (React's onDelegate).
 * @fires vdocs-cancel - Fired when the user dismisses the dialog via the overlay or the close button (React's onCancel).
 */
export class VdocsDisclosureDialog extends VdocsElement {
  static override properties = {
    disclosures: { attribute: false },
    delegator: { type: Boolean },
    accepted: { state: true },
  };

  /** The disclosure content to display. Property-only; defaults to the standard Verdocs disclosures. */
  declare disclosures?: TemplateResult;
  /** If true, a Delegate button is included so the recipient can reassign signing. */
  declare delegator: boolean;

  private declare accepted: boolean;

  constructor() {
    super();
    this.delegator = false;
    this.accepted = false;
  }

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleAgree = () => {
    this.emit('vdocs-agree');
  };

  private handleDecline = () => {
    this.emit('vdocs-decline');
  };

  private handleDelegate = () => {
    this.emit('vdocs-delegate');
  };

  private handleCheckedChange = (e: CustomEvent<{ checked: boolean }>) => {
    // The composed control's event is an implementation detail; the dialog's
    // public contract is vdocs-agree.
    e.stopPropagation();
    this.accepted = e.detail.checked;
  };

  override render() {
    const footer = html`
      <div class="vdocs:flex vdocs:flex-row vdocs:gap-3">
        <vdocs-button label="Decline" variant="outline" class="vdocs:mr-auto" @click=${this.handleDecline}></vdocs-button>
        ${this.delegator ? html`<vdocs-button label="Delegate" variant="outline" @click=${this.handleDelegate}></vdocs-button>` : nothing}
        <vdocs-button label="Proceed" .disabled=${!this.accepted} @click=${this.handleAgree}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog heading="e-Signature Disclosures" .footer=${footer} @vdocs-close=${this.handleClose}>
        ${this.disclosures ?? DEFAULT_DISCLOSURE_CONTENT}

        <div class="vdocs:mt-4">
          <vdocs-checkbox
            label="I accept the electronic signature disclosures and agree to proceed with digital signing."
            .checked=${this.accepted}
            @vdocs-checked-change=${this.handleCheckedChange}></vdocs-checkbox>
        </div>
      </vdocs-dialog>`;
  }
}

register('vdocs-disclosure-dialog', VdocsDisclosureDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-disclosure-dialog': VdocsDisclosureDialog;
  }
}
