import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { caretDownIcon } from './icons/index.js';
import { register } from '../base/register.js';

export interface IFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Display a drop-down menu of quick filter options, as a compact
 * "Label: Value" pill. Used above lists and tables. Options go through the
 * `options` property (arrays never travel as attributes).
 *
 * @fires vdocs-select - Fired when the user picks an option, with the IFilterOption in detail.
 */
export class VdocsQuickFilter extends VdocsElement {
  static override properties = {
    options: { attribute: false },
    label: { type: String },
    value: { type: String },
    placeholder: { type: String },
    open: { state: true },
  };

  /** The filter options to display. Property-only. */
  declare options: IFilterOption[];
  /** Prefix label shown before the selected value. */
  declare label: string;
  /** The currently selected value. */
  declare value: string;
  /** Shown when no option matches the current value. */
  declare placeholder: string;

  private declare open: boolean;

  private handleWindowClick = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.open = false;
    }
  };

  constructor() {
    super();
    this.options = [];
    this.label = 'Filter';
    this.value = '';
    this.placeholder = 'Select...';
    this.open = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:relative', 'vdocs:inline-block', 'vdocs:font-sans');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.handleWindowClick);
  }

  override updated() {
    // Listen for outside clicks only while open. Adding the listener here
    // (after the toggling click finished) instead of in the click handler
    // keeps that same click from immediately closing the menu.
    if (this.open) {
      window.addEventListener('click', this.handleWindowClick);
    } else {
      window.removeEventListener('click', this.handleWindowClick);
    }
  }

  private toggleOpen() {
    this.open = !this.open;
  }

  private select(option: IFilterOption) {
    this.open = false;
    this.emit('vdocs-select', option);
  }

  override render() {
    const selectedOption = this.options.find(option => option.value === this.value);

    return html`
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:h-8 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:whitespace-nowrap vdocs:hover:border-muted"
        @click=${this.toggleOpen}>
        <span class="vdocs:text-muted">${this.label}:</span>
        ${selectedOption ? selectedOption.label : this.placeholder}
        <span class="vdocs:border-l vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:ml-1"></span>
        ${caretDownIcon({ className: 'vdocs:size-5 vdocs:text-muted' })}
      </button>

      ${this.open ?
        html`
          <div
            role="listbox"
            class="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:min-w-full vdocs:w-max vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
            ${this.options.map(option => html`
              <button
                type="button"
                role="option"
                aria-selected=${option.value === this.value}
                ?disabled=${option.disabled}
                class="vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:border-none vdocs:cursor-pointer vdocs:disabled:text-edge vdocs:disabled:cursor-default ${option.value === this.value ?
                  'vdocs:bg-canvas vdocs:text-accent vdocs:font-medium' :
                  'vdocs:bg-surface vdocs:text-ink vdocs:hover:bg-canvas'}"
                @click=${() => this.select(option)}>
                ${option.label}
              </button>`)}
          </div>` :
        ''}`;
  }
}

register('vdocs-quick-filter', VdocsQuickFilter);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-quick-filter': VdocsQuickFilter;
  }
}
