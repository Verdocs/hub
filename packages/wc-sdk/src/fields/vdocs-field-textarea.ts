import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties, type IFieldChangeDetail } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

// The legacy 150x15 default footprint. The page renderer sizes fields to their
// real boxes with inline styles; these defaults only matter when one renders
// standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[150px] vdocs:h-[15px] vdocs:font-sans vdocs:text-[11px]';

const labelChip = (label: string) => html`
  <label
    class="vdocs:absolute vdocs:-top-3.5 vdocs:-left-px vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
    ${label}
  </label>`;

/**
 * A multi-line text entry field for signing. The textarea is uncontrolled:
 * field.value (or the template default) seeds it, and hosts persist edits
 * reported through vdocs-field-change (React's onFieldChange callback). Set
 * done to render the final value as text.
 *
 * @fires vdocs-field-change - Fired after each edit, with the full text content in detail.value.
 */
export class VdocsFieldTextarea extends VdocsElement implements IFieldBaseProperties {
  static override properties = {
    field: { attribute: false },
    disabled: { type: Boolean },
    done: { type: Boolean },
    focused: { type: Boolean },
    signerIndex: { type: Number, attribute: 'signer-index' },
    hasFocus: { state: true },
  };

  /** The field to render. Template fields render defaults; envelope fields render live values. Property-only. */
  declare field?: IEnvelopeField | ITemplateField;
  /** Disable input regardless of the field's own readonly state (preview modes). */
  declare disabled: boolean;
  /** Render the display-final-value state (signing is complete for this field). */
  declare done: boolean;
  /** Draw the focused treatment and move keyboard focus onto the inner textarea. */
  declare focused: boolean;
  /** Zero-based recipient index, used for the vdocs-signer-N background class. */
  declare signerIndex: number;

  private declare hasFocus: boolean;

  constructor() {
    super();
    this.disabled = false;
    this.done = false;
    this.focused = false;
    this.signerIndex = 0;
    this.hasFocus = false;
  }

  override updated(changed: PropertyValues<this>) {
    const field = this.field;
    if (!field) {
      return;
    }

    if (this.done) {
      syncFieldClasses(this, [
        'vdocs-field vdocs-field-done',
        BOX_CLASSES,
        'vdocs:border vdocs:border-solid vdocs:border-ink/20 vdocs:text-ink',
      ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      BOX_CLASSES,
      'vdocs:border vdocs:border-solid',
      field.required ? 'vdocs-field-required vdocs:border-danger' : 'vdocs:border-ink/20',
      this.disabled && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level
      // stylesheet. An accent ring gives the same cue without shipping
      // keyframes.
      (this.focused || this.hasFocus) && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);

    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused property as it walks the signer along.
    if (changed.has('focused') && this.focused) {
      this.querySelector('textarea')?.focus();
    }
  }

  private handleInput(e: Event) {
    this.emit<IFieldChangeDetail>('vdocs-field-change', { value: (e.target as HTMLTextAreaElement).value });
  }

  private handleFocus() {
    this.hasFocus = true;
  }

  private handleBlur() {
    this.hasFocus = false;
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

    const label = field.label ?? '';
    const required = !!field.required;
    const readonly = !!field.readonly;

    // Bindings inside a textarea's content do not work (the browser parses it
    // as raw text), so the value seeds through the property. Lit only writes
    // it when the computed value changes, which preserves the signer's
    // in-progress edits across re-renders, mirroring the React field's
    // uncontrolled defaultValue.
    return html`
      ${label ? labelChip(label) : nothing}
      <textarea
        name=${field.name}
        aria-label=${label || field.name}
        ?required=${required}
        placeholder=${field.placeholder ?? ''}
        ?disabled=${readonly || this.disabled}
        .value=${value}
        @input=${this.handleInput}
        @focus=${this.handleFocus}
        @blur=${this.handleBlur}
        class="vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:resize-none vdocs:border-none vdocs:outline-none vdocs:bg-transparent vdocs:px-[3px] vdocs:py-0 vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink${this.disabled ? ' vdocs:opacity-50' : ''}"></textarea>`;
  }
}

register('vdocs-field-textarea', VdocsFieldTextarea);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-textarea': VdocsFieldTextarea;
  }
}
