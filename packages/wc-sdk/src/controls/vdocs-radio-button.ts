import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * A simple radio button for UI displays, e.g. dialog boxes. This is distinct
 * from the field radio button used in signing experiences. Buttons sharing the
 * same name form a native group. Listen for `vdocs-checked-change` (the
 * react-sdk's onChange), which fires on the button the user just selected;
 * deselected group-mates update silently, as native radios do.
 *
 * ```html
 * <vdocs-radio-button label="Typed" name="mode" value="type" checked></vdocs-radio-button>
 * <vdocs-radio-button label="Drawn" name="mode" value="draw"></vdocs-radio-button>
 * ```
 *
 * @fires vdocs-checked-change - Fired when the user selects the button, with the new checked state in detail.
 */
export class VdocsRadioButton extends VdocsElement {
  static override properties = {
    label: { type: String },
    checked: { type: Boolean },
    disabled: { type: Boolean },
    name: { type: String },
    value: { type: String },
  };

  /** Label displayed to the right of the button. Leave blank for no label. */
  declare label: string;
  declare checked: boolean;
  declare disabled: boolean;
  /** Group name, forwarded to the native input. Buttons sharing a name form a group. */
  declare name: string;
  /** Forwarded to the native input for form participation. */
  declare value: string;

  // A radio that loses its selection never fires change; the browser just
  // unchecks it when another input in the group is picked. We watch the
  // group-mate's change bubble past and resync our property, otherwise a later
  // render would push the stale checked state back onto the input and steal
  // the selection.
  private handleDocumentChange = (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    const input = this.querySelector('input');
    if (input && target !== input && this.name && target?.type === 'radio' && target.name === this.name) {
      this.checked = input.checked;
    }
  };

  constructor() {
    super();
    this.label = '';
    this.checked = false;
    this.disabled = false;
    this.name = '';
    this.value = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
    document.addEventListener('change', this.handleDocumentChange);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('change', this.handleDocumentChange);
  }

  private handleChange(e: Event) {
    this.checked = (e.target as HTMLInputElement).checked;
    this.emit('vdocs-checked-change', { checked: this.checked });
  }

  override render() {
    return html`
      <label
        class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50">
        <input
          type="radio"
          name=${this.name || nothing}
          value=${this.value || nothing}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          class="vdocs:appearance-none vdocs:m-0 vdocs:size-4 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-ink/60 vdocs:bg-canvas vdocs:transition vdocs:duration-200 vdocs:outline-none vdocs:checked:bg-primary vdocs:checked:ring-2 vdocs:checked:ring-inset vdocs:checked:ring-canvas vdocs:focus-visible:border-primary vdocs:disabled:cursor-default vdocs:disabled:bg-canvas vdocs:disabled:border-canvas"
          @change=${this.handleChange} />
        ${this.label ? html`<span class="vdocs:text-sm">${this.label}</span>` : nothing}
      </label>`;
  }
}

register('vdocs-radio-button', VdocsRadioButton);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-radio-button': VdocsRadioButton;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-checked-change': CustomEvent<{ checked: boolean }>;
  }
}
