import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { clearIcon, copyIcon, eyeIcon, eyeSlashIcon } from './icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import { showToast } from '../utils/toast.js';

export type TTextInputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';

/**
 * A standard text input field with minimal markup, styled to match the other
 * controls. The element tracks its own value as the user types; read it from
 * the `value` property or listen for events:
 *
 * - `vdocs-input` fires on every keystroke with `{ value }` in detail.
 * - `vdocs-blur` fires when the field loses focus with `{ value }` in detail.
 * - `vdocs-clear` fires when the user clicks the clear button.
 *
 * Setting the `value` property programmatically updates the field and fires
 * nothing, matching native input behavior.
 *
 * @fires vdocs-input - Fired on every keystroke with the current value in detail.
 * @fires vdocs-blur - Fired when the field loses focus with the current value in detail.
 * @fires vdocs-clear - Fired when the user clicks the clear button.
 */
export class VdocsTextInput extends VdocsElement {
  static override properties = {
    label: { type: String },
    description: { type: String },
    clearable: { type: Boolean },
    copyable: { type: Boolean },
    type: { type: String },
    required: { type: Boolean },
    disabled: { type: Boolean },
    placeholder: { type: String },
    autocomplete: { type: String },
    inputmode: { type: String },
    value: { type: String },
    showingPw: { state: true },
  };

  /** The label for the field. */
  declare label: string;
  /** Displayed below the field in a small font, typically instructions or reminders. */
  declare description: string;
  /** If set, a clear button will be displayed when the field has a value. */
  declare clearable: boolean;
  /**
   * If set, a copy-to-clipboard button will be displayed. A field may not be
   * both clearable and copyable; clearable wins if both are set.
   */
  declare copyable: boolean;
  /** Only text-like input types are supported by this control. */
  declare type: TTextInputType;
  declare required: boolean;
  declare disabled: boolean;
  declare placeholder: string;
  /** Forwarded to the native input's autocomplete attribute. */
  declare autocomplete: string;
  /** Forwarded to the native input's inputmode attribute, e.g. 'numeric' for a one-time code field. */
  declare inputmode: string;
  declare value: string;

  private declare showingPw: boolean;

  constructor() {
    super();
    this.label = '';
    this.description = '';
    this.clearable = false;
    this.copyable = false;
    this.type = 'text';
    this.required = false;
    this.disabled = false;
    this.placeholder = '';
    this.autocomplete = '';
    this.inputmode = '';
    this.value = '';
    this.showingPw = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private handleInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.emit('vdocs-input', { value: this.value });
  }

  private handleBlur() {
    this.emit('vdocs-blur', { value: this.value });
  }

  private handleClear() {
    this.emit('vdocs-clear');
  }

  private togglePassword() {
    this.showingPw = !this.showingPw;
  }

  private copyToClipboard() {
    navigator.clipboard
      .writeText(this.value ?? '')
      .then(() => showToast('Copied!'))
      .catch(() => showToast('Unable to copy to the clipboard.', { style: 'error' }));
  }

  override render() {
    const buttonClasses = 'vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer';

    return html`
      <label class="vdocs:block vdocs:font-sans vdocs:mb-2.5">
        ${this.label ?
          html`
            <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
              ${this.label}:${this.required ? html`<span class="vdocs:text-danger">*</span>` : nothing}
            </div>` :
          nothing}

        <div class="vdocs:relative vdocs:flex vdocs:items-center">
          <input
            type=${this.type === 'password' && this.showingPw ? 'text' : this.type}
            .value=${live(this.value)}
            ?required=${this.required}
            ?disabled=${this.disabled}
            placeholder=${this.placeholder || nothing}
            autocomplete=${this.autocomplete || nothing}
            inputmode=${this.inputmode || nothing}
            data-lpignore="true"
            class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
            @input=${this.handleInput}
            @blur=${this.handleBlur} />

          ${this.clearable && !!this.value ?
            html`
              <button type="button" aria-label="Clear" class="${buttonClasses} vdocs:text-edge vdocs:hover:text-muted" @click=${this.handleClear}>
                ${clearIcon({ className: 'vdocs:size-4' })}
              </button>` :
            nothing}

          ${this.type === 'password' ?
            html`
              <button
                type="button"
                aria-label=${this.showingPw ? 'Hide password' : 'Show password'}
                class="${buttonClasses} vdocs:text-muted"
                @click=${this.togglePassword}>
                ${this.showingPw ? eyeIcon({ className: 'vdocs:size-5' }) : eyeSlashIcon({ className: 'vdocs:size-5' })}
              </button>` :
            nothing}

          ${!this.clearable && this.copyable && !!this.value ?
            html`
              <button type="button" aria-label="Copy to clipboard" class="${buttonClasses} vdocs:text-muted" @click=${this.copyToClipboard}>
                ${copyIcon({ className: 'vdocs:size-4' })}
              </button>` :
            nothing}
        </div>

        ${this.description ? html`<div class="vdocs:text-xs vdocs:text-muted vdocs:mt-1">${this.description}</div>` : nothing}
      </label>`;
  }
}

register('vdocs-text-input', VdocsTextInput);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-text-input': VdocsTextInput;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-input': CustomEvent<{ value: string }>;
    'vdocs-blur': CustomEvent<{ value: string }>;
    'vdocs-clear': CustomEvent<undefined>;
  }
}
