import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-button.js';
import './dialog-events.js';
import './vdocs-dialog.js';

/**
 * A simple message dialog with an OK button and an optional Cancel button.
 * Purely presentational: the host mounts it conditionally and removes it on
 * vdocs-ok/vdocs-cancel. Regardless of show-cancel, the dialog is always
 * dismissable via the overlay and the close button, both of which fire
 * vdocs-cancel.
 *
 * React prop mapping: heading and message are the same-named properties
 * (strings through the attributes, TemplateResults through the properties),
 * buttonLabel is button-label, and showCancel is show-cancel.
 *
 * ```html
 * <vdocs-ok-dialog heading="Are you sure?" message="This cannot be undone." show-cancel></vdocs-ok-dialog>
 * ```
 *
 * @fires vdocs-ok - Fired when the user clicks the OK button (React's onOk).
 * @fires vdocs-cancel - Fired when the user clicks Cancel, the close button, or the background overlay (React's onCancel).
 */
export class VdocsOkDialog extends VdocsElement {
  static override properties = {
    heading: {},
    message: {},
    buttonLabel: { type: String, attribute: 'button-label' },
    showCancel: { type: Boolean, attribute: 'show-cancel' },
  };

  /** The title of the dialog. "title" is a reserved word, so we use heading. */
  declare heading?: string | TemplateResult;
  /** The message content to display. The legacy component took an HTML string; pass a TemplateResult for rich content. */
  declare message?: string | TemplateResult;
  /** Override the OK button's label. */
  declare buttonLabel: string;
  /** If set, a Cancel button is also displayed. */
  declare showCancel: boolean;

  constructor() {
    super();
    this.buttonLabel = 'OK';
    this.showCancel = false;
  }

  // Footer templates run with the base dialog as their event host, so these
  // handlers are arrow properties; see vdocs-dialog.
  private handleClose = (e: Event) => {
    // The base dialog's vdocs-close is an implementation detail of this
    // composition; the public dismissal contract is vdocs-cancel.
    e.stopPropagation();
    this.emit('vdocs-cancel');
  };

  private handleCancel = () => {
    this.emit('vdocs-cancel');
  };

  private handleOk = () => {
    this.emit('vdocs-ok');
  };

  override render() {
    // The legacy heading also rendered a document icon, but the base dialog
    // styles hid it (the design moved to a plain title plus close button), so
    // we don't port it.
    const footer = html`
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
        ${this.showCancel ? html`<vdocs-button label="Cancel" variant="outline" @click=${this.handleCancel}></vdocs-button>` : nothing}
        <vdocs-button label=${this.buttonLabel} @click=${this.handleOk}></vdocs-button>
      </div>`;

    return html`
      <vdocs-dialog .heading=${this.heading} .footer=${footer} @vdocs-close=${this.handleClose}>
        ${this.message}
      </vdocs-dialog>`;
  }
}

register('vdocs-ok-dialog', VdocsOkDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-ok-dialog': VdocsOkDialog;
  }
}
