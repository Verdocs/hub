import { html } from 'lit';
import { live } from 'lit/directives/live.js';
import type { IDelegateDetails } from './dialog-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-text-input.js';
import '../controls/vdocs-button.js';
import './vdocs-dialog.js';

/**
 * Collect the details needed to delegate signing responsibility to someone
 * else. Purely presentational: the sign embed wires vdocs-delegate to the
 * delegation endpoint and removes the dialog when the request completes.
 *
 * @fires vdocs-delegate - Fired with the collected IDelegateDetails in detail when the user submits (React's onDelegate).
 * @fires vdocs-cancel - Fired when the user cancels via the Cancel button, the close control, or the overlay (React's onCancel).
 */
export class VdocsDelegateDialog extends VdocsElement {
  static override properties = {
    details: { state: true },
  };

  private declare details: IDelegateDetails;

  constructor() {
    super();
    this.details = { first_name: '', last_name: '', email: '', phone: '', message: '' };
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

  private handleDelegate = () => {
    this.emit<IDelegateDetails>('vdocs-delegate', this.details);
  };

  private handleFieldInput(field: keyof IDelegateDetails) {
    return (e: CustomEvent<{ value: string }>) => {
      // The composed control's event is an implementation detail; the dialog's
      // public contract is vdocs-delegate.
      e.stopPropagation();
      this.details = { ...this.details, [field]: e.detail.value };
    };
  }

  private handleMessageInput = (e: Event) => {
    this.details = { ...this.details, message: (e.target as HTMLTextAreaElement).value };
  };

  override render() {
    const canDelegate = !!this.details.first_name && !!this.details.last_name && !!this.details.email;

    const footer = html`
      <div class="vdocs:flex vdocs:justify-end vdocs:gap-4">
        <vdocs-button label="Cancel" variant="outline" @click=${this.handleCancel}></vdocs-button>
        <vdocs-button label="Delegate" .disabled=${!canDelegate} @click=${this.handleDelegate}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog heading="Delegate Signing" .footer=${footer} @vdocs-close=${this.handleClose}>
        <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          New Recipient:<span class="vdocs:text-danger">*</span>
        </div>
        <div class="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
          <vdocs-text-input
            placeholder="First name"
            .value=${this.details.first_name}
            @vdocs-input=${this.handleFieldInput('first_name')}></vdocs-text-input>
          <vdocs-text-input
            placeholder="Last name"
            .value=${this.details.last_name}
            @vdocs-input=${this.handleFieldInput('last_name')}></vdocs-text-input>
        </div>

        <vdocs-text-input
          label="Email Address"
          required
          type="email"
          placeholder="New recipient email address"
          .value=${this.details.email}
          @vdocs-input=${this.handleFieldInput('email')}></vdocs-text-input>

        <vdocs-text-input
          label="Phone Number"
          type="tel"
          placeholder="Optional phone number"
          .value=${this.details.phone}
          @vdocs-input=${this.handleFieldInput('phone')}></vdocs-text-input>

        <label class="vdocs:block vdocs:font-sans">
          <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
            Message (optional)
          </div>
          <textarea
            rows="3"
            placeholder="Type message here..."
            .value=${live(this.details.message)}
            @input=${this.handleMessageInput}
            class="vdocs:w-full vdocs:px-2.5 vdocs:py-2 vdocs:text-sm vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:resize-y vdocs:focus:border-accent"></textarea>
        </label>
      </vdocs-dialog>`;
  }
}

register('vdocs-delegate-dialog', VdocsDelegateDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-delegate-dialog': VdocsDelegateDialog;
  }
}
