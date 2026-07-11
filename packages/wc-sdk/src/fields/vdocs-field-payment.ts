import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { signerClassName, syncFieldClasses, type IFieldBaseProperties } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { checkIcon } from '../controls/icons/index.js';
import { register } from '../base/register.js';

const BOX_CLASSES = 'vdocs:font-sans vdocs:relative vdocs:box-border vdocs:block vdocs:size-6 vdocs:text-[11px] vdocs:scroll-my-5 vdocs:border vdocs:border-solid vdocs:border-[#ccffaa]';

// The legacy component drew "$" plus a check character once payment was
// collected. We keep the treatment but draw the check as an icon so the glyph
// scales with the box.
const paidTreatment = () => html`
  <span
    role="img"
    aria-label="Paid"
    class="vdocs:flex vdocs:size-full vdocs:items-center vdocs:justify-center vdocs:gap-px vdocs:font-medium vdocs:text-[rgba(0,0,0,0.87)]">
    $
    ${checkIcon({ className: 'vdocs:size-3' })}
  </span>`;

/**
 * Displays a payment field. Unpaid, it renders a dollar-sign affordance and
 * reports clicks through vdocs-begin-payment (React's onBeginPayment
 * callback) so the host can run the payment flow; paid or done, it renders a
 * dollar-and-check "collected" treatment.
 *
 * This is a representative display port. The legacy component carried
 * vestigial payment plumbing with no provider integration: recipient lists
 * feeding a prepared-by message that never rendered, and a stamp image that
 * was never populated. Collecting a payment belongs to the sign embed era, so
 * none of that is ported. Builder-only affordances (drag, resize, the
 * settings popover) are omitted per docs/PORTING.md.
 *
 * @fires vdocs-begin-payment - Fired when the user clicks the unpaid field to start the payment flow.
 */
export class VdocsFieldPayment extends VdocsElement implements IFieldBaseProperties {
  static override properties = {
    field: { attribute: false },
    paid: { type: Boolean },
    disabled: { type: Boolean },
    done: { type: Boolean },
    focused: { type: Boolean },
    signerIndex: { type: Number, attribute: 'signer-index' },
  };

  /** The field to render. Template fields render defaults; envelope fields render live values. Property-only. */
  declare field?: IEnvelopeField | ITemplateField;
  /** Render the payment-collected treatment instead of the payment affordance. */
  declare paid: boolean;
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
    this.paid = false;
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

    syncFieldClasses(this, [
      'vdocs-field',
      !!field.required && 'vdocs-required',
      this.disabled && 'vdocs-disabled',
      this.focused && 'vdocs-focused',
      this.paid && 'vdocs-filled',
      signerClassName(this.signerIndex),
      BOX_CLASSES,
      'vdocs:cursor-pointer',
      this.disabled && 'vdocs:opacity-50',
    ]);

    if (changed.has('focused') && this.focused) {
      this.querySelector('button')?.focus();
    }
  }

  private handleBegin() {
    this.emit('vdocs-begin-payment');
  }

  override render() {
    const field = this.field;
    if (!field) {
      // Custom elements can be created before their properties are assigned;
      // render nothing until the field arrives.
      return nothing;
    }

    if (this.done || this.paid) {
      return paidTreatment();
    }

    return html`
      <button
        type="button"
        ?disabled=${this.disabled}
        @click=${this.handleBegin}
        aria-label="Payment"
        class="vdocs:box-border vdocs:size-full vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:font-sans vdocs:font-medium vdocs:text-[11px] vdocs:text-[rgba(0,0,0,0.87)] vdocs:cursor-pointer vdocs:disabled:cursor-default">
        $
      </button>`;
  }
}

register('vdocs-field-payment', VdocsFieldPayment);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-payment': VdocsFieldPayment;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-begin-payment': CustomEvent<undefined>;
  }
}
