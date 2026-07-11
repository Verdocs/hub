import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { caretDownIcon } from './icons/index.js';
import { register } from '../base/register.js';

export interface IMultiSelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value tracked in selectedOptions. */
  value: string;
}

// aria-labelledby needs a page-unique id per instance, and light-DOM ids land
// in the host page, so a module counter does the job.
let nextLabelId = 0;

/**
 * Display a dropdown that allows multiple options to be selected. The trigger
 * summarizes the current selection; pressing it opens a checkbox list that
 * stays open while the user toggles options and closes on an outside click or
 * Escape. The element tracks the selection as the user toggles options; read
 * it from the `selectedOptions` property or listen for
 * `vdocs-selection-changed`, which fires with `{ selectedOptions }` in detail
 * (React's onSelectionChanged callback is this element's
 * vdocs-selection-changed event). Setting the property programmatically
 * updates the trigger and fires nothing.
 *
 * @fires vdocs-selection-changed - Fired when the user toggles an option, with the new selection in detail.
 */
export class VdocsMultiSelect extends VdocsElement {
  static override properties = {
    options: { attribute: false },
    selectedOptions: { attribute: false },
    label: { type: String },
    placeholder: { type: String },
    open: { state: true },
  };

  /** The options to list. Property-only. */
  declare options: IMultiSelectOption[];
  /** The values currently selected. Property-only. */
  declare selectedOptions: string[];
  /** The label for the field. */
  declare label: string;
  /** Shown in the trigger when no options are selected. */
  declare placeholder: string;

  private declare open: boolean;

  private labelId = `vdocs-multi-select-label-${nextLabelId++}`;

  private handleDocumentClick = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.open = false;
    }
  };

  private handleDocumentKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.open = false;
    }
  };

  constructor() {
    super();
    this.options = [];
    this.selectedOptions = [];
    this.label = '';
    this.placeholder = 'Select...';
    this.open = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleDocumentKeydown);
  }

  override updated() {
    // Listen for outside clicks and Escape only while open. Adding the
    // listeners here (after the toggling click finished) instead of in the
    // click handler keeps that same click from immediately closing the list.
    if (this.open) {
      document.addEventListener('click', this.handleDocumentClick);
      document.addEventListener('keydown', this.handleDocumentKeydown);
    } else {
      document.removeEventListener('click', this.handleDocumentClick);
      document.removeEventListener('keydown', this.handleDocumentKeydown);
    }
  }

  private toggleOpen() {
    this.open = !this.open;
  }

  private toggleOption(option: IMultiSelectOption, e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.selectedOptions = checked ?
        [ ...this.selectedOptions, option.value ] :
        this.selectedOptions.filter(value => value !== option.value);
    this.emit('vdocs-selection-changed', { selectedOptions: this.selectedOptions });
  }

  override render() {
    return html`
      <div class="vdocs:block vdocs:w-full vdocs:font-sans vdocs:mb-2.5">
        ${this.label ?
          html`<div id=${this.labelId} class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">${this.label}:</div>` :
          nothing}

        <div class="vdocs:relative">
          <button
            type="button"
            aria-expanded=${this.open}
            aria-labelledby=${this.label ? this.labelId : nothing}
            class="vdocs:relative vdocs:flex vdocs:flex-wrap vdocs:items-center vdocs:gap-1 vdocs:w-full vdocs:min-h-10 vdocs:box-border vdocs:pl-2.5 vdocs:pr-8 vdocs:py-1 vdocs:text-sm vdocs:text-left vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:outline-none vdocs:focus:border-accent"
            @click=${this.toggleOpen}>
            ${this.selectedOptions.length === 0 ?
              html`<span class="vdocs:text-muted">${this.placeholder}</span>` :
                this.selectedOptions.map(value => html`<span class="vdocs:inline-block vdocs:px-1.5 vdocs:py-0.5 vdocs:text-xs vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-ctl">${this.options.find(option => option.value === value)?.label || 'Unknown'}</span>`)}
            ${caretDownIcon({
              className: `vdocs:absolute vdocs:right-2 vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:size-4.5 vdocs:text-muted ${this.open ? 'vdocs:rotate-180' : ''}`,
            })}
          </button>

          ${this.open ?
            html`
              <div
                role="group"
                aria-labelledby=${this.label ? this.labelId : nothing}
                class="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-52 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
                ${this.options.map(option => html`
                  <label class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:px-2 vdocs:py-1.5 vdocs:text-[13px] vdocs:text-ink vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:hover:bg-canvas">
                    <input
                      type="checkbox"
                      .checked=${live(this.selectedOptions.includes(option.value))}
                      class="vdocs:size-4 vdocs:accent-primary vdocs:cursor-pointer"
                      @change=${(e: Event) => this.toggleOption(option, e)} />
                    ${option.label}
                  </label>`)}
              </div>` :
            nothing}
        </div>
      </div>`;
  }
}

register('vdocs-multi-select', VdocsMultiSelect);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-multi-select': VdocsMultiSelect;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-selection-changed': CustomEvent<{ selectedOptions: string[] }>;
  }
}
