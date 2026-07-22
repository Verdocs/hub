import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import './vdocs-adopt-signature-dialog.js';

/**
 * The initials counterpart to vdocs-signature-dialog: a thin composition of
 * vdocs-adopt-signature-dialog in its initials variant, with initials labels
 * and a half-width preview. The adopted PNG comes back through vdocs-adopted
 * as a data URL, with the entered initials in the payload's fullName field.
 *
 * Purely presentational: persisting the image (createInitials in js-sdk) and
 * writing it to the field are the host's job, from the vdocs-adopted event.
 *
 * React prop mapping: initials is the same-named attribute.
 *
 * @fires vdocs-adopted - Fired with the adopted IAdoptedSignature in detail; bubbles up from the composed adopt dialog (React's onAdopt).
 * @fires vdocs-cancel - Fired when the user cancels or dismisses the dialog; bubbles up from the composed adopt dialog (React's onCancel).
 */
export class VdocsInitialDialog extends VdocsElement {
  static override properties = {
    initials: { type: String },
  };

  /** Seeds the Initials input. Displayed uppercased, matching the legacy dialog. */
  declare initials: string;

  constructor() {
    super();
    this.initials = '';
  }

  override render() {
    return html`<vdocs-adopt-signature-dialog variant="initials" .fullName=${this.initials}></vdocs-adopt-signature-dialog>`;
  }
}

register('vdocs-initial-dialog', VdocsInitialDialog);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-initial-dialog': VdocsInitialDialog;
  }
}
