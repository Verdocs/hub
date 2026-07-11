import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { signerClassName, syncFieldClasses, type IFieldBaseProperties } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

const BOX_CLASSES = 'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:w-[83px] vdocs:h-9 vdocs:text-[11px] vdocs:tracking-[0.3px] vdocs:scroll-my-5';

const IMAGE_CLASSES = 'vdocs:block vdocs:h-full vdocs:w-auto vdocs:max-w-none';

// The legacy chip was a bare label; a span avoids implying a form association
// that does not exist.
const labelChip = (label: string) => html`
  <span
    class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:text-white vdocs:bg-[#4a4a99] vdocs:rounded-t-[2px]">
    ${label}
  </span>`;

/**
 * Displays a signature field. Unsigned, it renders the "Signature" affordance
 * and reports clicks through vdocs-begin-signing (React's onBeginSigning
 * callback) so the host can run the adopt-a-signature dialog. Once signed
 * (signature-url set) or done, the adopted image is drawn sized to the field
 * box.
 *
 * The legacy component fetched the signature blob by ID itself. Here the host
 * resolves the image and passes a URL; the sign embed will own that lookup,
 * along with the legacy Edit/Clear menu on a signed field. Builder-only
 * affordances (drag, resize, the settings popover) are omitted per
 * docs/PORTING.md.
 *
 * @fires vdocs-begin-signing - Fired when the user clicks the unsigned field to start the adopt-a-signature flow.
 */
export class VdocsFieldSignature extends VdocsElement implements IFieldBaseProperties {
  static override properties = {
    field: { attribute: false },
    signatureUrl: { type: String, attribute: 'signature-url' },
    disabled: { type: Boolean },
    done: { type: Boolean },
    focused: { type: Boolean },
    signerIndex: { type: Number, attribute: 'signer-index' },
  };

  /** The field to render. Template fields render defaults; envelope fields render live values. Property-only. */
  declare field?: IEnvelopeField | ITemplateField;
  /** Resolved URL for the adopted signature image (a data:, blob:, or https: URL). */
  declare signatureUrl: string;
  /** Disable input regardless of the field's own readonly state (preview modes). */
  declare disabled: boolean;
  /** Render the display-final-value state (signing is complete for this field). */
  declare done: boolean;
  /** Draw the focused treatment and move keyboard focus onto the inner button. */
  declare focused: boolean;
  /** Zero-based recipient index, used for the vdocs-signer-N background class. */
  declare signerIndex: number;

  constructor() {
    super();
    this.signatureUrl = '';
    this.disabled = false;
    this.done = false;
    this.focused = false;
    this.signerIndex = 0;
  }

  override updated(changed: PropertyValues<this>) {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [ 'vdocs-field vdocs-done', BOX_CLASSES ]);
      return;
    }

    const signed = !!this.signatureUrl;
    const required = !!field.required;

    syncFieldClasses(this, [
      'vdocs-field',
      required && 'vdocs-required',
      this.disabled && 'vdocs-disabled',
      this.focused && 'vdocs-focused',
      signed && 'vdocs-filled',
      signerClassName(this.signerIndex),
      BOX_CLASSES,
      'vdocs:cursor-pointer',
      // Signed fields drop their border and background so only the image
      // shows. The signer class stays on the element as a white-label hook;
      // bg-transparent outranks it because the utilities layer comes after
      // components, standing in for the legacy .filled !important.
      signed ?
        'vdocs:bg-transparent' :
        `vdocs:border vdocs:border-solid ${required ? 'vdocs:border-danger' : 'vdocs:border-[rgba(0,0,0,0.2)]'}`,
    ]);

    if (changed.has('focused') && this.focused) {
      this.querySelector('button')?.focus();
    }
  }

  private handleBegin() {
    this.emit('vdocs-begin-signing');
  }

  override render() {
    const field = this.field;
    if (!field) {
      // Custom elements can be created before their properties are assigned;
      // render nothing until the field arrives.
      return nothing;
    }

    if (this.done) {
      return this.signatureUrl ? html`<img class=${IMAGE_CLASSES} src=${this.signatureUrl} alt="Signature" />` : nothing;
    }

    return html`
      ${field.label ? labelChip(field.label) : nothing}
      ${this.signatureUrl ?
        html`
          <div class="vdocs:relative vdocs:size-full${this.disabled ? ' vdocs:opacity-50 vdocs:pointer-events-none' : ''}">
            <img class=${IMAGE_CLASSES} src=${this.signatureUrl} alt="Signature" />
          </div>` :
        html`
          <button
            type="button"
            ?disabled=${this.disabled}
            @click=${this.handleBegin}
            class="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default">
            Signature
          </button>`}`;
  }
}

register('vdocs-field-signature', VdocsFieldSignature);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-signature': VdocsFieldSignature;
  }
}
