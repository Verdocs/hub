import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * A standard date input field, styled to match the other controls. The value
 * is always an ISO yyyy-mm-dd string. The element tracks its own value as the
 * user edits; read it from the `value` property or listen for `vdocs-input`,
 * which fires with `{ value }` in detail (React's value/onChange pair is this
 * element's value property plus that event). Setting the `value` property
 * programmatically updates the field and fires nothing, matching native input
 * behavior.
 *
 * @fires vdocs-input - Fired as the user edits the date, with the current value in detail.
 */
export class VdocsDateInput extends VdocsElement {
  static override properties = {
    label: { type: String },
    description: { type: String },
    value: { type: String },
    required: { type: Boolean },
    disabled: { type: Boolean },
  };

  /** The label for the field. */
  declare label: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  declare description: string;
  /** The current value as an ISO yyyy-mm-dd string. */
  declare value: string;
  declare required: boolean;
  declare disabled: boolean;

  constructor() {
    super();
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

  private handleInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.emit('vdocs-input', { value: this.value });
  }

  override render() {
    // The legacy Stencil control embedded the air-datepicker widget. The native SDKs lean on the
    // platform date picker (input type="date") instead: no dependency, and a stable value format.
    return html`
      <label class="vdocs:block vdocs:font-sans vdocs:mb-2.5">
        ${this.label ?
          html`
            <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
              ${this.label}:${this.required ? html`<span class="vdocs:text-danger">*</span>` : nothing}
            </div>` :
          nothing}

        <input
          type="date"
          .value=${live(this.value)}
          ?required=${this.required}
          ?disabled=${this.disabled}
          data-lpignore="true"
          class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
          @input=${this.handleInput} />

        ${this.description ? html`<div class="vdocs:text-xs vdocs:text-muted vdocs:mt-1">${this.description}</div>` : nothing}
      </label>`;
  }
}

register('vdocs-date-input', VdocsDateInput);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-date-input': VdocsDateInput;
  }
}
