import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export type TSwitchTheme = 'primary' | 'secondary';

const THEME_CLASSES: Record<TSwitchTheme, string> = {
  primary: 'vdocs:checked:bg-primary',
  secondary: 'vdocs:checked:bg-accent-dark',
};

/**
 * A toggle switch for boolean settings. Wraps a native checkbox input exposed
 * with the switch role, so it participates in forms and assistive tech like
 * any input. Listen for `vdocs-checked-change` for the new value (the
 * react-sdk's onCheckedChange); the wrapped input's native change event also
 * bubbles through the element for anyone who wants the raw event (the
 * react-sdk's onChange). Setting `checked` programmatically updates the
 * switch and fires nothing, matching native input behavior.
 *
 * ```html
 * <vdocs-switch label="Send reminders" checked></vdocs-switch>
 * ```
 *
 * @fires vdocs-checked-change - Fired when the user toggles the switch, with the new checked state in detail.
 */
export class VdocsSwitch extends VdocsElement {
  static override properties = {
    label: { type: String },
    theme: { type: String },
    checked: { type: Boolean },
    disabled: { type: Boolean },
    name: { type: String },
    value: { type: String },
  };

  /** Label displayed to the right of the switch. */
  declare label: string;
  /** Select the green (primary) or blue (secondary) treatment. */
  declare theme: TSwitchTheme;
  declare checked: boolean;
  declare disabled: boolean;
  /** Forwarded to the native input for form participation. */
  declare name: string;
  /** Forwarded to the native input for form participation. */
  declare value: string;

  constructor() {
    super();
    this.label = '';
    this.theme = 'primary';
    this.checked = false;
    this.disabled = false;
    this.name = '';
    this.value = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  private handleChange(e: Event) {
    this.checked = (e.target as HTMLInputElement).checked;
    this.emit('vdocs-checked-change', { checked: this.checked });
  }

  override render() {
    // The input is the track. The thumb has to be a following sibling, not a
    // child, for peer-checked to move it.
    return html`
      <label class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-not-allowed">
        <span class="vdocs:relative vdocs:inline-flex vdocs:h-6 vdocs:w-11 vdocs:shrink-0">
          <input
            type="checkbox"
            role="switch"
            name=${this.name || nothing}
            value=${this.value || nothing}
            .checked=${live(this.checked)}
            ?disabled=${this.disabled}
            class="vdocs:peer vdocs:appearance-none vdocs:absolute vdocs:inset-0 vdocs:m-0 vdocs:size-full vdocs:cursor-pointer vdocs:rounded-full vdocs:bg-edge-light vdocs:transition-colors vdocs:duration-150 vdocs:disabled:cursor-not-allowed vdocs:disabled:bg-disabled ${THEME_CLASSES[this.theme]}"
            @change=${this.handleChange} />
          <span
            class="vdocs:pointer-events-none vdocs:absolute vdocs:top-0.5 vdocs:left-0.5 vdocs:size-5 vdocs:rounded-full vdocs:bg-white vdocs:shadow-lg vdocs:transition-transform vdocs:duration-150 vdocs:peer-checked:translate-x-5"></span>
        </span>
        ${this.label ? html`<span class="vdocs:text-sm">${this.label}</span>` : nothing}
      </label>`;
  }
}

register('vdocs-switch', VdocsSwitch);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-switch': VdocsSwitch;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-checked-change': CustomEvent<{ checked: boolean }>;
  }
}
