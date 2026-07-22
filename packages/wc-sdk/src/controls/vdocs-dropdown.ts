import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { menuArrowIcon } from './icons/index.js';
import { register } from '../base/register.js';

export interface IMenuOption {
  /** The label to display. Options with an empty label render as separators. */
  label: string;
  /** Identifier carried by vdocs-select when the option is chosen. */
  id?: string;
  disabled?: boolean;
}

/**
 * Display a drop-down menu button. A menu of the specified options is shown
 * when the button is pressed, and hidden when an option is selected or the
 * user clicks elsewhere. Separators may be created by supplying an entry with
 * an empty label. Clicks are stopped from propagating so a dropdown can sit
 * inside a clickable row without triggering it.
 *
 * @fires vdocs-select - Fired when the user picks an option, with the IMenuOption in detail.
 */
export class VdocsDropdown extends VdocsElement {
  static override properties = {
    options: { attribute: false },
    open: { state: true },
  };

  /** The menu options to display. Property-only. */
  declare options: IMenuOption[];

  private declare open: boolean;

  private handleWindowClick = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.open = false;
    }
  };

  constructor() {
    super();
    this.options = [];
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

  private toggleOpen(e: Event) {
    e.stopPropagation();
    this.open = !this.open;
  }

  private select(e: Event, option: IMenuOption) {
    e.stopPropagation();
    this.open = false;
    this.emit('vdocs-select', option);
  }

  override render() {
    return html`
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded=${this.open}
        aria-label="Open menu"
        class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:rounded-ctl vdocs:cursor-pointer vdocs:text-primary vdocs:hover:bg-canvas"
        @click=${this.toggleOpen}>
        ${menuArrowIcon({ className: 'vdocs:size-6' })}
      </button>

      ${this.open ?
        html`
          <div
            role="menu"
            class="vdocs:absolute vdocs:right-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-40 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
            ${this.options.map(option => option.label ?
              html`
                <button
                  type="button"
                  role="menuitem"
                  ?disabled=${option.disabled}
                  class="vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border-none vdocs:cursor-pointer vdocs:hover:bg-canvas vdocs:disabled:text-edge vdocs:disabled:cursor-default vdocs:disabled:bg-surface"
                  @click=${(e: Event) => this.select(e, option)}>
                  ${option.label}
                </button>` :
              html`<div class="vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:my-1"></div>`)}
          </div>` :
        ''}`;
  }
}

register('vdocs-dropdown', VdocsDropdown);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-dropdown': VdocsDropdown;
  }
}
