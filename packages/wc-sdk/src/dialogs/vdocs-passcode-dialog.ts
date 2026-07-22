import { html, nothing } from 'lit';
import type { IDialogSubmitDetail } from './dialog-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';
import './vdocs-dialog.js';

/**
 * Prompt the signer for the passcode protecting an envelope. Purely
 * presentational: the sign embed wires vdocs-submit to the signer verification
 * endpoint and reports a rejected passcode back through the error property.
 * The dialog is persistent: only Cancel and the close button dismiss it.
 *
 * @fires vdocs-submit - Fired with the entered passcode in detail.value; the input clears for the next attempt (React's onSubmit).
 * @fires vdocs-cancel - Fired when the user cancels via the Cancel button or the close control (React's onCancel).
 */
export class VdocsPasscodeDialog extends VdocsElement {
  static override properties = {
    error: { type: String },
    code: { state: true },
  };

  /** Displayed below the input in the danger color, typically after the verification endpoint rejects the passcode. */
  declare error: string;

  private declare code: string;

  constructor() {
    super();
    this.error = '';
    this.code = '';
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

  private handleSubmit = () => {
    this.emit<IDialogSubmitDetail>('vdocs-submit', { value: this.code });
    this.code = '';
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
        <vdocs-button label="Submit" .disabled=${!this.code} @click=${this.handleSubmit}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog heading="Passcode Required" persistent .footer=${footer} @vdocs-close=${this.handleClose}>
        <p class="vdocs:mt-0 vdocs:mb-5">
          This document is protected by a passcode. Please enter it below to proceed. If you do not have one, please contact the sender.
        </p>

        <vdocs-text-input placeholder="Enter passcode..." .value=${this.code} @vdocs-input=${this.handleCodeInput}></vdocs-text-input>

        ${this.error ? html`<div role="alert" class="vdocs:mt-2 vdocs:text-sm vdocs:text-danger">${this.error}</div>` : nothing}
      </vdocs-dialog>`;
  }
}

register('vdocs-passcode-dialog', VdocsPasscodeDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-passcode-dialog': VdocsPasscodeDialog;
  }
}
