import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export interface IToggleButton {
  /** Identifier for the button, reported in vdocs-change. */
  id: string;
  /** Accessible name for the button. */
  label: string;
  /** Icon template for the button face. Icons render at 30px and inherit the current text color. */
  icon: TemplateResult;
}

/**
 * A group of icon buttons where exactly one is selected at a time, with an
 * optional heading label. Leave `selection` unset for uncontrolled use with
 * `defaultSelection`; set it to control the selection yourself. Listen for
 * `vdocs-change` (the react-sdk's onChange) with the chosen button and its
 * index in detail.
 *
 * @fires vdocs-change - Fired when the user selects a button, with the IToggleButton and its index in detail.
 */
export class VdocsToggle extends VdocsElement {
  static override properties = {
    label: { type: String },
    buttons: { attribute: false },
    defaultSelection: { type: Number, attribute: 'default-selection' },
    selection: { type: Number },
    internalSelection: { state: true },
  };

  /** Optional heading label displayed before the buttons. Also names the group for assistive tech. */
  declare label: string;
  /** The buttons to display. Property-only. */
  declare buttons: IToggleButton[];
  /** Index of the initially selected button, for uncontrolled use. Defaults to 0. */
  declare defaultSelection: number;
  /** Index of the selected button. Set this to control the selection. */
  declare selection?: number;

  private declare internalSelection?: number;

  constructor() {
    super();
    this.label = '';
    this.buttons = [];
    this.defaultSelection = 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private handleSelect(button: IToggleButton, index: number) {
    this.internalSelection = index;
    this.emit('vdocs-change', { button, index });
  }

  override render() {
    const selectedIndex = this.selection ?? this.internalSelection ?? this.defaultSelection;

    return html`
      <div role="group" aria-label=${this.label || nothing} class="vdocs:flex vdocs:items-center vdocs:bg-canvas vdocs:font-sans">
        ${this.label ? html`<span class="vdocs:text-2xl vdocs:font-bold vdocs:text-ink vdocs:mr-7">${this.label}:</span>` : nothing}
        <div class="vdocs:flex vdocs:gap-[11px]">
          ${this.buttons.map((button, index) => html`
            <button
              type="button"
              aria-label=${button.label}
              aria-pressed=${index === selectedIndex}
              class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-[60px] vdocs:p-0 vdocs:border-2 vdocs:border-solid vdocs:border-accent vdocs:rounded-row vdocs:cursor-pointer vdocs:transition-colors vdocs:duration-200 vdocs:[&_svg]:size-[30px] vdocs:hover:bg-accent vdocs:hover:text-canvas ${index === selectedIndex ?
                'vdocs:bg-accent-light vdocs:text-white' :
                'vdocs:bg-surface vdocs:text-ink'}"
              @click=${() => this.handleSelect(button, index)}>
              ${button.icon}
            </button>`)}
        </div>
      </div>`;
  }
}

register('vdocs-toggle', VdocsToggle);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-toggle': VdocsToggle;
  }
}
