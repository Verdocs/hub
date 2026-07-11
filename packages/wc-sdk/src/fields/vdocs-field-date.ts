import { html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';
import { fieldValue, signerClassName, syncFieldClasses, type IFieldBaseProperties, type IFieldChangeDetail } from './field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

// The legacy 74x20 default footprint. The page renderer sizes fields to their
// real boxes with inline styles; these defaults only matter when one renders
// standalone.
const BOX_CLASSES = 'vdocs:relative vdocs:box-border vdocs:block vdocs:w-[74px] vdocs:h-5 vdocs:font-sans vdocs:text-[11px] vdocs:tracking-[0.3px]';

const labelChip = (label: string) => html`
  <label
    class="vdocs:absolute vdocs:-top-3.5 vdocs:left-0 vdocs:h-3.5 vdocs:px-1 vdocs:font-sans vdocs:text-[9px] vdocs:leading-[13px] vdocs:whitespace-nowrap vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-t-[2px]">
    ${label}
  </label>`;

// Stored values may be date-only strings or full ISO timestamps. The native
// date input only accepts yyyy-mm-dd, so we trim ISO strings and fall back to
// parsing anything else with local date parts (round-tripping through
// toISOString would shift days across timezones).
const toInputDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

// Date-only strings parse as UTC midnight, so calling toLocaleDateString on
// the parsed Date would show the previous day in negative-offset timezones.
// Building the Date from its parts keeps the displayed date the one the
// signer picked.
const toDisplayDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toInputDate(value));
  if (!match) {
    return value;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString();
};

/**
 * A date entry field for signing. The legacy component embedded the
 * air-datepicker widget; like the DateInput control, we lean on the platform
 * picker (input type="date") instead: no dependency, and a stable yyyy-mm-dd
 * value format. Native date inputs ignore placeholder text, so the legacy
 * "Date..." placeholder is dropped. Reports picks through vdocs-field-change
 * (React's onFieldChange callback).
 *
 * @fires vdocs-field-change - Fired when the signer picks a date, with the ISO yyyy-mm-dd string (empty when cleared) in detail.value.
 */
export class VdocsFieldDate extends VdocsElement implements IFieldBaseProperties {
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
  /** Draw the focused treatment and move keyboard focus onto the inner input. */
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
      syncFieldClasses(this, [ 'vdocs-field vdocs-field-done', BOX_CLASSES, 'vdocs:font-medium vdocs:text-ink' ]);
      return;
    }

    syncFieldClasses(this, [
      'vdocs-field',
      signerClassName(this.signerIndex),
      BOX_CLASSES,
      field.required && 'vdocs-field-required',
      this.disabled && 'vdocs-field-disabled',
      // The legacy focused treatment was a ripple animation in the app-level
      // stylesheet. An accent ring gives the same cue without shipping
      // keyframes.
      (this.focused || this.hasFocus) && 'vdocs-field-focused vdocs:ring-2 vdocs:ring-accent',
    ]);

    // Replaces the legacy focusField() imperative method: the sign flow drives
    // focus through the focused property as it walks the signer along.
    if (changed.has('focused') && this.focused) {
      this.querySelector('input')?.focus();
    }
  }

  private handleInput(e: Event) {
    this.emit<IFieldChangeDetail>('vdocs-field-change', { value: (e.target as HTMLInputElement).value });
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
      return html`${toDisplayDate(value)}`;
    }

    const label = field.label ?? '';
    const required = !!field.required;
    const readonly = !!field.readonly;
    // The legacy field dropped to a smaller font when the field box was drawn small.
    const small = (field.width ?? 74) < 74 || (field.height ?? 20) < 20;

    // The value attribute seeds the input's default value, mirroring the React
    // field's uncontrolled defaultValue.
    return html`
      ${label ? labelChip(label) : nothing}
      <input
        type="date"
        name=${field.name}
        aria-label=${label || field.name}
        ?required=${required}
        ?disabled=${readonly || this.disabled}
        value=${toInputDate(value)}
        @input=${this.handleInput}
        @focus=${this.handleFocus}
        @blur=${this.handleBlur}
        class="vdocs:block vdocs:w-full vdocs:h-full vdocs:box-border vdocs:appearance-none vdocs:outline-none vdocs:bg-transparent vdocs:font-sans vdocs:font-medium vdocs:text-ink vdocs:border vdocs:border-solid ${required ? 'vdocs:border-danger' : 'vdocs:border-edge-light'} ${small ? 'vdocs:text-[7px]' : 'vdocs:text-xs'}${this.disabled ? ' vdocs:opacity-50' : ''}" />`;
  }
}

register('vdocs-field-date', VdocsFieldDate);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-field-date': VdocsFieldDate;
  }
}
