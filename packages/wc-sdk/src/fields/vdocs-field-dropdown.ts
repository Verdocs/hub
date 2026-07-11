import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties, type IFieldChangeDetail } from './field-base.js';
import { caretDownIcon } from '../controls/icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

const labelChip = (label: string) => html`
  <div
    aria-hidden="true"
    class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent vdocs:rounded-t-xs">
    ${label}
  </div>`;

const SELECT_CLASSES = [
  'vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:box-border vdocs:size-full vdocs:appearance-none vdocs:cursor-pointer',
  'vdocs:py-0 vdocs:pl-1 vdocs:pr-3.5 vdocs:text-[11px] vdocs:font-medium vdocs:text-ink vdocs:bg-transparent',
  'vdocs:border vdocs:border-solid vdocs:rounded-ctl vdocs:outline-none',
  'vdocs:disabled:opacity-50 vdocs:disabled:cursor-default',
].join(' ');

/**
 * A dropdown signing field that lets the signer choose one of the field's
 * options. Renders the field's current value from its properties and reports
 * selection through vdocs-field-change (React's onFieldChange callback).
 * Builder affordances (dragging, the settings popover) are not ported; see
 * docs/PORTING.md.
 *
 * @fires vdocs-field-change - Fired when the signer picks an option, with the selected option's id in detail.value.
 */
export class VdocsFieldDropdown extends VdocsElement implements IFieldBaseProperties {
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
  /** Draw the focused treatment and move keyboard focus onto the inner select. */
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
        'vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:font-sans vdocs:text-[11px] vdocs:font-medium vdocs:text-ink',
      ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      'vdocs:relative vdocs:box-border vdocs:block vdocs:h-5 vdocs:w-[85px] vdocs:rounded-ctl vdocs:font-sans',
      'vdocs:focus-within:ring-2 vdocs:focus-within:ring-accent',
      this.focused && 'vdocs:ring-2 vdocs:ring-accent',
    ]);

    // The legacy focusField() imperative method becomes the focused property:
    // when the owner flips it on, move real keyboard focus onto the select.
    if (changed.has('focused') && this.focused) {
      this.querySelector('select')?.focus();
    }
  }

  private handleChange(e: Event) {
    this.emit<IFieldChangeDetail>('vdocs-field-change', { value: (e.target as HTMLSelectElement).value });
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

    // Envelope fields send options: null, and required/readonly are
    // boolean | null, so coerce instead of trusting the raw values.
    const options = field.options ?? [];
    const required = !!field.required;

    // The selected attribute sets default selectedness, mirroring the React
    // field's uncontrolled defaultValue: the signer's own choice survives
    // re-renders.
    return html`
      ${field.label ? labelChip(field.label) : nothing}
      <select
        name=${field.name}
        aria-label=${field.label || field.name}
        ?required=${required}
        ?disabled=${!!field.readonly || this.disabled}
        @change=${this.handleChange}
        class="${SELECT_CLASSES} ${required ? 'vdocs:border-danger' : 'vdocs:border-edge'}">
        <option value="">Select...</option>
        ${options.map(option => html`<option value=${option.id} ?selected=${option.id === value}>${option.label}</option>`)}
        ${options.length ? nothing : html`<option value="NA">N/A</option>`}
      </select>
      ${caretDownIcon({ className: 'vdocs:pointer-events-none vdocs:absolute vdocs:top-1/2 vdocs:right-0.5 vdocs:size-3 vdocs:-translate-y-1/2 vdocs:text-ink' })}`;
  }
}

register('vdocs-field-dropdown', VdocsFieldDropdown);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-dropdown': VdocsFieldDropdown;
  }
}
