import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { isFieldFilled, type IEnvelopeField } from '@verdocs/js-sdk';
import { circleCheckIcon } from '../controls/icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-button.js';
import './dialog-events.js';

/** Which stage of the signing flow the card reflects. */
export type TSigningProgressMode = 'start' | 'signing' | 'completed';

const FIELD_TYPE_LABELS: Record<string, string> = {
  signature: 'Signature',
  initial: 'Initials',
  date: 'Date',
  textbox: 'Text Field',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  dropdown: 'Dropdown',
  attachment: 'Attachment',
  payment: 'Payment',
};

const fieldLabel = (field?: IEnvelopeField) => {
  if (!field) {
    return '';
  }

  const typeName = FIELD_TYPE_LABELS[field.type] || 'Field';
  return field.required ? `Required ${typeName}*` : `Optional ${typeName}`;
};

const CARD_CLASSES = 'vdocs:box-border vdocs:flex vdocs:w-60 vdocs:flex-col vdocs:gap-3 vdocs:rounded-lg vdocs:bg-surface vdocs:p-4 ' +
  'vdocs:shadow-lg vdocs:font-sans';

// The React port stretches its buttons through className on the native
// button; our button control renders its own inner button, so we size the
// host and reach the inner button with an arbitrary variant.
const FULL_WIDTH_BUTTON = 'vdocs:w-full vdocs:[&>button]:w-full';

const separator = html`<div class="vdocs:h-px vdocs:w-full vdocs:bg-edge-light"></div>`;

/**
 * The floating progress card shown alongside the signing experience:
 * remaining field counts, the focused field's label, and the flow controls
 * (Start Signing, Previous/Next, Submit). Progress is derived entirely from
 * the field properties; the card keeps no state and runs no timers, so the
 * host advances the flow in response to the events. Not a modal: the card
 * renders in place, pinned by the host classes below.
 *
 * React prop mapping: mode is the same-named attribute, fields and
 * recipientFields are property-only arrays, and focusedField is
 * focused-field.
 *
 * @fires vdocs-start - Fired when the user clicks Start Signing (React's onStart).
 * @fires vdocs-next - Fired when the user clicks Next (React's onNext).
 * @fires vdocs-previous - Fired when the user clicks Previous (React's onPrevious).
 * @fires vdocs-submit - Fired bare when the user clicks Submit (React's onSubmit).
 */
export class VdocsSigningProgress extends VdocsElement {
  static override properties = {
    mode: { type: String },
    fields: { attribute: false },
    recipientFields: { attribute: false },
    focusedField: { type: String, attribute: 'focused-field' },
  };

  /** The stage to render: the pre-signing prompt, in-flight progress, or the ready-to-submit card. */
  declare mode: TSigningProgressMode;
  /** The fillable fields for the current recipient, in signing order. Property-only. */
  declare fields: IEnvelopeField[];
  /** Every field for the recipient, including auto-filled ones. Grouped radio checks need the full set; defaults to fields. Property-only. */
  declare recipientFields?: IEnvelopeField[];
  /** The name of the currently focused field, used to show its label and position. */
  declare focusedField: string;

  constructor() {
    super();
    this.mode = 'start';
    this.fields = [];
    this.focusedField = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    // The legacy card pins itself above the document viewer and disappears on
    // small screens; hosts add their own classes to override the placement.
    this.classList.add('vdocs:fixed', 'vdocs:top-16', 'vdocs:left-5', 'vdocs:z-[900]', 'vdocs:max-[600px]:hidden');
  }

  private handleStart = () => {
    this.emit('vdocs-start');
  };

  private handleNext = () => {
    this.emit('vdocs-next');
  };

  private handlePrevious = () => {
    this.emit('vdocs-previous');
  };

  private handleSubmit = () => {
    this.emit('vdocs-submit');
  };

  // js-sdk counts a grouped radio as filled when any member of its group is
  // selected. The legacy card layered stricter own-value checks on top for
  // dropdowns, radios, and checkboxes, and we keep its exact predicate.
  private isFilled(field: IEnvelopeField): boolean {
    return Boolean(isFieldFilled(field, this.recipientFields ?? this.fields)) &&
      (field.type !== 'dropdown' || !!field.value) &&
      (field.type !== 'radio' || field.value === 'true') &&
      (field.type !== 'checkbox' || field.value === 'true');
  }

  override render() {
    if (this.mode === 'completed') {
      return html`
        <div class=${CARD_CLASSES}>
          <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-sm vdocs:font-medium vdocs:text-ink">
            ${circleCheckIcon({ className: 'vdocs:size-6 vdocs:shrink-0 vdocs:text-success' })}
            Ready to Submit
          </div>
          <div class="vdocs:text-xs vdocs:leading-4 vdocs:text-muted">
            You have entered all requested signatures. Select Submit to complete the signing process.
          </div>
          ${separator}
          <vdocs-button label="Submit" size="small" class=${FULL_WIDTH_BUTTON} @click=${this.handleSubmit}></vdocs-button>
        </div>`;
    }

    const requiredFields = this.fields.filter(field => field.required);
    const requiredRemaining = requiredFields.filter(field => !this.isFilled(field)).length;
    const optionalFields = this.fields.filter(field => !field.required);
    const optionalRemaining = optionalFields.filter(field => !this.isFilled(field)).length;

    const focusedFieldObj = this.fields.find(field => field.name === this.focusedField);
    const currentIndex = Math.max(1, this.fields.findIndex(field => field.name === this.focusedField) + 1);
    const readyToSubmit = requiredRemaining === 0;
    const focusedDone = focusedFieldObj ? this.isFilled(focusedFieldObj) : false;

    let body: TemplateResult;
    if (this.mode !== 'start' && focusedDone && readyToSubmit) {
      body = html`
        <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-xs vdocs:leading-4 vdocs:text-ink">
          ${circleCheckIcon({ className: 'vdocs:size-6 vdocs:shrink-0 vdocs:text-success' })}
          Ready to submit.
        </div>`;
    } else {
      body = html`<div class="vdocs:text-xs vdocs:leading-4 vdocs:text-ink">${fieldLabel(focusedFieldObj)}</div>`;
    }

    let footer: TemplateResult;
    if (this.mode === 'start') {
      footer = html`<vdocs-button label="Start Signing" size="small" class=${FULL_WIDTH_BUTTON} @click=${this.handleStart}></vdocs-button>`;
    } else if (readyToSubmit) {
      footer = html`<vdocs-button label="Submit" size="small" class=${FULL_WIDTH_BUTTON} @click=${this.handleSubmit}></vdocs-button>`;
    } else {
      footer = html`
        <div class="vdocs:flex vdocs:w-full vdocs:gap-3">
          <vdocs-button
            label="Previous"
            size="small"
            variant="outline"
            class="vdocs:flex-1 vdocs:[&>button]:w-full"
            .disabled=${currentIndex <= 1}
            @click=${this.handlePrevious}></vdocs-button>
          <vdocs-button
            label="Next"
            size="small"
            class="vdocs:flex-1 vdocs:[&>button]:w-full"
            .disabled=${currentIndex >= this.fields.length}
            @click=${this.handleNext}></vdocs-button>
        </div>`;
    }

    return html`
      <div class=${CARD_CLASSES}>
        <div class="vdocs:flex vdocs:flex-col vdocs:gap-1.5 vdocs:text-sm vdocs:text-ink">
          <div>${requiredRemaining} of ${requiredFields.length} required fields remaining</div>
          ${optionalFields.length > 0 ?
            html`<div class="vdocs:text-muted">${optionalRemaining} of ${optionalFields.length} optional fields remaining</div>` :
            nothing}
        </div>

        ${body}
        ${separator}
        ${footer}
      </div>`;
  }
}

register('vdocs-signing-progress', VdocsSigningProgress);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-signing-progress': VdocsSigningProgress;
  }
}
