import { html, nothing } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

// The legacy 160x15 default footprint. The page renderer sizes fields to their
// real boxes with inline styles; these defaults only matter when one renders
// standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-40 vdocs:h-[15px] vdocs:font-sans vdocs:text-[9px]';

const labelChip = (label: string) => html`
  <label
    class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
    ${label}
  </label>`;

const toDisplayTimestamp = (value: string): string => {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

/**
 * A display-only timestamp field. Signers never type into these: the platform
 * stamps them when the document is submitted, so the field fires no events.
 * The legacy component previewed the current time in a permanently disabled
 * input; a hint reads clearer, so an unfilled field says what will happen
 * instead of showing a time that is not real yet.
 */
export class VdocsFieldTimestamp extends VdocsElement implements IFieldBaseProperties {
  static override properties = {
    field: { attribute: false },
    disabled: { type: Boolean },
    done: { type: Boolean },
    focused: { type: Boolean },
    signerIndex: { type: Number, attribute: 'signer-index' },
  };

  /** The field to render. Template fields render defaults; envelope fields render live values. Property-only. */
  declare field?: IEnvelopeField | ITemplateField;
  /** Disable input regardless of the field's own readonly state (preview modes). */
  declare disabled: boolean;
  /** Render the display-final-value state (signing is complete for this field). */
  declare done: boolean;
  /** Draw the focused treatment. Timestamps take no input, so nothing receives keyboard focus. */
  declare focused: boolean;
  /** Zero-based recipient index, used for the vdocs-signer-N background class. */
  declare signerIndex: number;

  constructor() {
    super();
    this.disabled = false;
    this.done = false;
    this.focused = false;
    this.signerIndex = 0;
  }

  override updated() {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [ 'vdocs-field vdocs-field-done', BOX_CLASSES, 'vdocs:font-medium vdocs:text-ink' ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      BOX_CLASSES,
      // The legacy scss put the required border on the host for timestamps,
      // not the inner box.
      field.required && 'vdocs-field-required vdocs:border vdocs:border-solid vdocs:border-danger',
      this.disabled && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level
      // stylesheet. An accent ring gives the same cue without shipping
      // keyframes.
      this.focused && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);
  }

  override render() {
    const field = this.field;
    if (!field) {
      // Custom elements can be created before their properties are assigned;
      // render nothing until the field arrives.
      return nothing;
    }

    const value = fieldValue(field);

    if (this.done) {
      return value ? html`${toDisplayTimestamp(value)}` : nothing;
    }

    // The 50% opacity mirrors the legacy pre-completion treatment: the value is
    // provisional until the envelope is done, and the field draws full-strength
    // then.
    return html`
      ${field.label ? labelChip(field.label) : nothing}
      <div
        class="vdocs:flex vdocs:items-center vdocs:w-full vdocs:h-full vdocs:box-border vdocs:px-0.5 vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:font-medium vdocs:text-ink vdocs:opacity-50">
        ${value ? toDisplayTimestamp(value) : field.placeholder || 'Filled at signing'}
      </div>`;
  }
}

register('vdocs-field-timestamp', VdocsFieldTimestamp);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-timestamp': VdocsFieldTimestamp;
  }
}
