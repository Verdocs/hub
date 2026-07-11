import { html, nothing, svg } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties, type IFieldChangeDetail } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-checkbox.js';

// The legacy done state printed a check mark or an empty box as text glyphs.
// Sources are ASCII-only and controls/icons has no empty-box icon, so we draw
// the two shapes here, matching the React field.
const doneGlyph = (checked: boolean) => html`
  <svg viewBox="0 0 16 16" fill="none" role="img" aria-label=${checked ? 'Checked' : 'Unchecked'} class="vdocs:size-3.5">
    ${checked ?
      svg`<path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` :
      svg`<rect x="2.5" y="2.5" width="11" height="11" stroke="currentColor" stroke-width="1.5" />`}
  </svg>`;

const labelChip = (label: string) => html`
  <div
    aria-hidden="true"
    class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
    ${label}
  </div>`;

/**
 * A checkbox signing field. Renders the field's current value from its
 * properties and reports toggles through vdocs-field-change (React's
 * onFieldChange callback). Builder affordances (dragging, the settings
 * popover) are not ported; see docs/PORTING.md.
 *
 * Composes the same design-system checkbox the React field does. The control
 * has no required or aria-label pass-through, so the required treatment lives
 * entirely on the host border here.
 *
 * @fires vdocs-field-change - Fired when the signer toggles the box, with the new checked state (boolean) in detail.value.
 */
export class VdocsFieldCheckbox extends VdocsElement implements IFieldBaseProperties {
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

  private get checked(): boolean {
    return !!this.field && fieldValue(this.field) === 'true';
  }

  override async updated(changed: PropertyValues<this>) {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [ 'vdocs-field', 'vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans vdocs:text-ink' ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:size-4 vdocs:font-sans',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      !!field.required && 'vdocs:border vdocs:border-solid vdocs:border-danger',
      this.focused && 'vdocs:ring-2 vdocs:ring-accent',
    ]);

    // The legacy focusField() imperative method becomes the focused property:
    // when the owner flips it on, move real keyboard focus onto the input. The
    // input belongs to the composed vdocs-checkbox, which renders on its own
    // update cycle, so wait for it before reaching in.
    if (changed.has('focused') && this.focused) {
      await this.querySelector('vdocs-checkbox')?.updateComplete;
      this.querySelector('input')?.focus();
    }
  }

  private handleChange(e: CustomEvent<{ checked: boolean }>) {
    // The composed control's event is an implementation detail; the field's
    // public contract is vdocs-field-change.
    e.stopPropagation();
    this.emit<IFieldChangeDetail>('vdocs-field-change', { value: e.detail.checked });
  }

  override render() {
    const field = this.field;
    if (!field) {
      // Custom elements can be created before their properties are assigned;
      // render nothing until the field arrives.
      return nothing;
    }

    if (this.done) {
      return doneGlyph(this.checked);
    }

    return html`
      ${field.label ? labelChip(field.label) : nothing}
      <vdocs-checkbox
        size="small"
        name=${field.name}
        .checked=${this.checked}
        ?disabled=${!!field.readonly || this.disabled}
        @vdocs-checked-change=${this.handleChange}></vdocs-checkbox>`;
  }
}

register('vdocs-field-checkbox', VdocsFieldCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-checkbox': VdocsFieldCheckbox;
  }
}
