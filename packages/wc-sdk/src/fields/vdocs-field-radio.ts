import { html, nothing, svg } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties, type IFieldChangeDetail } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-radio-button.js';

// The legacy done state inlined these two Material circle glyphs as SVG
// strings. Controls/icons has no radio glyphs, so they live here, matching
// the React field.
const SELECTED_PATH = 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 ' +
  '0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';
const UNSELECTED_PATH = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z';

const doneGlyph = (selected: boolean) => html`
  <svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-label=${selected ? 'Selected' : 'Not selected'} class="vdocs:size-2.5">
    ${svg`<path d=${selected ? SELECTED_PATH : UNSELECTED_PATH} />`}
  </svg>`;

const labelChip = (label: string) => html`
  <div
    aria-hidden="true"
    class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
    ${label}
  </div>`;

/**
 * A radio button signing field. Each field is a single button; buttons sharing
 * the same group form an exclusive set. Reports selection through
 * vdocs-field-change (React's onFieldChange callback), with this option's id
 * (the field name) in detail.value. Builder affordances (dragging, the
 * settings popover, the group tag) are not ported; see docs/PORTING.md.
 *
 * Composes the same design-system radio button the React field does. The
 * control has no required or aria-label pass-through, so the required
 * treatment lives entirely on the host border here.
 *
 * @fires vdocs-field-change - Fired when the signer selects the button, with this option's id (the field name) in detail.value.
 */
export class VdocsFieldRadio extends VdocsElement implements IFieldBaseProperties {
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
  /** Draw the focused treatment and move keyboard focus onto the inner input. */
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

  private get selected(): boolean {
    return !!this.field && fieldValue(this.field) === 'true';
  }

  override async updated(changed: PropertyValues<this>) {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [ 'vdocs-field', 'vdocs:box-border vdocs:block vdocs:size-2.5 vdocs:font-sans vdocs:text-ink' ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:rounded-full vdocs:font-sans',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      !!field.required && 'vdocs:border vdocs:border-solid vdocs:border-danger',
      this.focused && 'vdocs:ring-2 vdocs:ring-accent',
    ]);

    // The legacy focusField() imperative method becomes the focused property:
    // when the owner flips it on, move real keyboard focus onto the input. The
    // input belongs to the composed vdocs-radio-button, which renders on its
    // own update cycle, so wait for it before reaching in.
    if (changed.has('focused') && this.focused) {
      await this.querySelector('vdocs-radio-button')?.updateComplete;
      this.querySelector('input')?.focus();
    }
  }

  private handleChange(e: CustomEvent<{ checked: boolean }>) {
    // The composed control's event is an implementation detail; the field's
    // public contract is vdocs-field-change, fired only on selection (a radio
    // that loses its selection never fires, matching native behavior).
    e.stopPropagation();
    if (e.detail.checked && this.field) {
      this.emit<IFieldChangeDetail>('vdocs-field-change', { value: this.field.name });
    }
  }

  override render() {
    const field = this.field;
    if (!field) {
      // Custom elements can be created before their properties are assigned;
      // render nothing until the field arrives.
      return nothing;
    }

    if (this.done) {
      return doneGlyph(this.selected);
    }

    return html`
      ${field.label ? labelChip(field.label) : nothing}
      <vdocs-radio-button
        name=${field.group || field.name}
        .checked=${this.selected}
        ?disabled=${!!field.readonly || this.disabled}
        @vdocs-checked-change=${this.handleChange}></vdocs-radio-button>`;
  }
}

register('vdocs-field-radio', VdocsFieldRadio);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-radio': VdocsFieldRadio;
  }
}
