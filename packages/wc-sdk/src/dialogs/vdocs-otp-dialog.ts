import { html, nothing } from 'lit';
import type { IDialogSubmitDetail } from './dialog-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';
import './vdocs-dialog.js';

const RESEND_COOLDOWN_MS = 30000;

/**
 * Prompt the signer for the one-time code that was sent to them via email or
 * SMS. Purely presentational: the sign embed sends the initial code when it
 * mounts this dialog, wires vdocs-submit and vdocs-resend to the signer
 * verification endpoint, and reports a rejected code back through the error
 * property. The dialog is persistent: only Cancel and the close button
 * dismiss it.
 *
 * @fires vdocs-submit - Fired with the entered code in detail.value; the input clears for the next attempt (React's onSubmit).
 * @fires vdocs-resend - Fired when the user requests a new code. Locked for 30 seconds after connecting, resending, or submitting (React's onResend).
 * @fires vdocs-cancel - Fired when the user cancels via the Cancel button or the close control (React's onCancel).
 */
export class VdocsOtpDialog extends VdocsElement {
  static override properties = {
    error: { type: String },
    code: { state: true },
    resendDisabled: { state: true },
  };

  /** Displayed below the input in the danger color, typically after the verification endpoint rejects a code. */
  declare error: string;

  private declare code: string;
  private declare resendDisabled: boolean;

  private cooldownTimer?: number;

  constructor() {
    super();
    this.error = '';
    this.code = '';
    this.resendDisabled = true;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.startCooldown();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.cooldownTimer);
  }

  // The legacy dialog locked the resend button for 30 seconds at a time to
  // keep signers from flooding themselves with codes. The lockout starts on
  // connect (the embed sends the first code when it mounts this dialog) and
  // restarts after every resend or submit.
  private startCooldown() {
    window.clearTimeout(this.cooldownTimer);
    this.resendDisabled = true;
    this.cooldownTimer = window.setTimeout(() => {
      this.resendDisabled = false;
    }, RESEND_COOLDOWN_MS);
  }

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleCancel = () => {
    this.emit('vdocs-cancel');
  };

  private handleResend = () => {
    this.code = '';
    this.startCooldown();
    this.emit('vdocs-resend');
  };

  private handleSubmit = () => {
    this.emit<IDialogSubmitDetail>('vdocs-submit', { value: this.code });
    this.code = '';
    this.startCooldown();
  };

  private handleCodeInput = (e: CustomEvent<{ value: string }>) => {
    // The composed control's event is an implementation detail; the dialog's
    // public contract is vdocs-submit.
    e.stopPropagation();
    this.code = e.detail.value;
  };

  override render() {
    const footer = html`
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <vdocs-button label="Cancel" variant="outline" @click=${this.handleCancel}></vdocs-button>
        <vdocs-button label="Resend" .disabled=${this.resendDisabled} @click=${this.handleResend}></vdocs-button>
        <vdocs-button label="Submit" .disabled=${!this.code} @click=${this.handleSubmit}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog heading="Verification Required" persistent .footer=${footer} @vdocs-close=${this.handleClose}>
        <p class="vdocs:mt-0 vdocs:mb-5">
          Please check your messages for a one-time code. If you did not receive it, be sure to check your Spam/Junk folder.
        </p>

        <vdocs-text-input placeholder="Enter your one-time code..." .value=${this.code} @vdocs-input=${this.handleCodeInput}></vdocs-text-input>

        ${this.error ? html`<div role="alert" class="vdocs:mt-2 vdocs:text-sm vdocs:text-danger">${this.error}</div>` : nothing}
      </vdocs-dialog>`;
  }
}

register('vdocs-otp-dialog', VdocsOtpDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-otp-dialog': VdocsOtpDialog;
  }
}
