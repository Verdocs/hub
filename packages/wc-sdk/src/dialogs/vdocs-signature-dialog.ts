import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import './vdocs-adopt-signature-dialog.js';

/**
 * The dialog the signing flow opens when a recipient reaches a signature
 * field without an adopted signature. A thin composition of
 * vdocs-adopt-signature-dialog in its signature variant: the user types or
 * draws a signature and the rendered PNG comes back through vdocs-adopted as
 * a data URL.
 *
 * Purely presentational: persisting the image (createSignature in js-sdk) and
 * writing it to the field are the host's job, from the vdocs-adopted event.
 *
 * React prop mapping: fullName is full-name.
 *
 * @fires vdocs-adopted - Fired with the adopted IAdoptedSignature in detail; bubbles up from the composed adopt dialog (React's onAdopt).
 * @fires vdocs-cancel - Fired when the user cancels or dismisses the dialog; bubbles up from the composed adopt dialog (React's onCancel).
 */
export class VdocsSignatureDialog extends VdocsElement {
  static override properties = {
    fullName: { type: String, attribute: 'full-name' },
  };

  /** Seeds the Full Name input, typically the recipient's name. */
  declare fullName: string;

  constructor() {
    super();
    this.fullName = '';
  }

  override render() {
    return html`<vdocs-adopt-signature-dialog .fullName=${this.fullName}></vdocs-adopt-signature-dialog>`;
  }
}

register('vdocs-signature-dialog', VdocsSignatureDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-signature-dialog': VdocsSignatureDialog;
  }
}
