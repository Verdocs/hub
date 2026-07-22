import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties, type IFieldChangeDetail } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

const labelChip = (label: string) => html`
  <div
    aria-hidden="true"
    class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
    ${label}
  </div>`;

/**
 * A single-line text signing field. Renders the field's current value from
 * its properties and reports edits through vdocs-field-change (React's
 * onFieldChange callback), with the full new text in detail.value after every
 * keystroke. The legacy component switched to a textarea for multiline
 * fields; that mode is vdocs-field-textarea's job here. Builder affordances
 * (dragging, resizing, the settings popover) are not ported; see
 * docs/PORTING.md.
 *
 * @fires vdocs-field-change - Fired after every keystroke, with the full new text in detail.value.
 */
export class VdocsFieldTextbox extends VdocsElement implements IFieldBaseProperties {
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

  override updated(changed: PropertyValues<this>) {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [
        'vdocs-field',
        'vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:tracking-[-0.2px] vdocs:text-ink',
      ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:h-[15px] vdocs:w-[150px] vdocs:rounded-ctl vdocs:font-sans vdocs:tracking-[-0.2px]',
      'vdocs:border vdocs:border-solid',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      field.required ? 'vdocs:border-danger' : 'vdocs:border-edge',
      this.focused && 'vdocs:ring-2 vdocs:ring-accent',
    ]);

    // The legacy focusField() imperative method becomes the focused property:
    // when the owner flips it on, move real keyboard focus onto the input.
    if (changed.has('focused') && this.focused) {
      this.querySelector('input')?.focus();
    }
  }

  private handleInput(e: Event) {
    this.emit<IFieldChangeDetail>('vdocs-field-change', { value: (e.target as HTMLInputElement).value });
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
      return html`${value}`;
    }

    // required and readonly are boolean | null on both field shapes, so
    // coerce before handing them to boolean attribute bindings.
    const required = !!field.required;
    const small = (field.height ?? 15) < 15;

    // Carried over from the legacy component: the field's pixel width caps how
    // many characters fit, at roughly 5px per character.
    const maxLength = Math.floor((field.width ?? 150) / 5);

    // The value attribute seeds the input's default value, mirroring the React
    // field's uncontrolled defaultValue: once the signer types, the browser's
    // dirty-value flag keeps later attribute writes from clobbering their text.
    return html`
      ${field.label ? labelChip(field.label) : nothing}
      <input
        type="text"
        name=${field.name}
        aria-label=${field.label || field.name}
        value=${value}
        maxlength=${maxLength}
        placeholder=${field.placeholder ?? ''}
        ?required=${required}
        ?disabled=${!!field.readonly || this.disabled}
        data-lpignore="true"
        @input=${this.handleInput}
        class="vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full vdocs:border-none vdocs:outline-none vdocs:bg-transparent vdocs:py-0 vdocs:px-[3px] vdocs:font-medium vdocs:text-ink vdocs:disabled:opacity-50 ${small ? 'vdocs:text-[8px]' : 'vdocs:text-[11px]'}" />`;
  }
}

register('vdocs-field-textbox', VdocsFieldTextbox);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-textbox': VdocsFieldTextbox;
  }
}
