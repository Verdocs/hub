import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export interface ISelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value reported when the option is selected. */
  value: string;
}

/**
 * A standard select field with minimal markup, styled to match the other
 * controls. The element tracks its own value as the user picks options; read
 * it from the `value` property or listen for `vdocs-change`, which fires with
 * `{ value }` in detail (React's value/onChange pair is this element's value
 * property plus that event). Setting the `value` property programmatically
 * updates the selection and fires nothing, matching native select behavior.
 *
 * @fires vdocs-change - Fired when the user picks an option, with the current value in detail.
 */
export class VdocsSelectInput extends VdocsElement {
  static override properties = {
    options: { attribute: false },
    label: { type: String },
    description: { type: String },
    value: { type: String },
    required: { type: Boolean },
    disabled: { type: Boolean },
  };

  /** The options to list. Property-only. */
  declare options: ISelectOption[];
  /** The label for the field. */
  declare label: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  declare description: string;
  /** The current value. */
  declare value: string;
  declare required: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.options = [];
    this.label = '';
    this.description = '';
    this.value = '';
    this.required = false;
    this.disabled = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private handleChange(e: Event) {
    this.value = (e.target as HTMLSelectElement).value;
    this.emit('vdocs-change', { value: this.value });
  }

  override render() {
    // Selection is bound per option, as a property: a .value binding on the
    // select itself would commit before the option children exist, leaving
    // nothing selected, and live() keeps re-renders honest after the user has
    // picked natively.
    const options = this.options.map(option => html`
      <option value=${option.value} .selected=${live(option.value === this.value)}>${option.label}</option>`);

    return html`
      <label class="vdocs:block vdocs:font-sans vdocs:mb-2.5">
        ${this.label ?
          html`
            <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
              ${this.label}:${this.required ? html`<span class="vdocs:text-danger">*</span>` : nothing}
            </div>` :
          nothing}

        <select
          ?required=${this.required}
          ?disabled=${this.disabled}
          class="vdocs:w-full vdocs:h-10 vdocs:px-2 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:cursor-pointer vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted vdocs:disabled:cursor-default"
          @change=${this.handleChange}>
          ${options}
        </select>

        ${this.description ? html`<div class="vdocs:text-xs vdocs:text-muted vdocs:mt-1">${this.description}</div>` : nothing}
      </label>`;
  }
}

register('vdocs-select-input', VdocsSelectInput);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-select-input': VdocsSelectInput;
  }
}
