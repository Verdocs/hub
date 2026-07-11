import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export type TCheckboxTheme = 'light' | 'dark';
export type TCheckboxSize = 'normal' | 'small';

const SIZE_CLASSES: Record<TCheckboxSize, { box: string; check: string }> = {
  normal: { box: 'vdocs:size-5', check: 'vdocs:size-3.5' },
  small: { box: 'vdocs:size-4', check: 'vdocs:size-3' },
};

const THEME_CLASSES: Record<TCheckboxTheme, string> = {
  light: 'vdocs:border-edge',
  dark: 'vdocs:border-white',
};

const checkMark = (className: string) => html`
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class=${className}>
    <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

/**
 * A simple check box for UI displays, e.g. dialog boxes. This is distinct from
 * the field checkbox used in signing experiences. The element tracks its own
 * checked state as the user toggles it; read it back from the `checked`
 * property or listen for `vdocs-checked-change` (the react-sdk's onChange).
 * Setting `checked` programmatically updates the box and fires nothing,
 * matching native input behavior.
 *
 * ```html
 * <vdocs-checkbox label="Remember me"></vdocs-checkbox>
 * ```
 *
 * @fires vdocs-checked-change - Fired when the user toggles the box, with the new checked state in detail.
 */
export class VdocsCheckbox extends VdocsElement {
  static override properties = {
    label: { type: String },
    theme: { type: String },
    size: { type: String },
    checked: { type: Boolean },
    disabled: { type: Boolean },
    name: { type: String },
    value: { type: String },
  };

  /** Label displayed to the right of the box. Leave blank for no label. */
  declare label: string;
  /** Use 'dark' when rendering on a dark background (lightens the unchecked border). */
  declare theme: TCheckboxTheme;
  /** The size of the box. */
  declare size: TCheckboxSize;
  declare checked: boolean;
  declare disabled: boolean;
  /** Forwarded to the native input for form participation. */
  declare name: string;
  /** Forwarded to the native input for form participation. */
  declare value: string;

  constructor() {
    super();
    this.label = '';
    this.theme = 'light';
    this.size = 'normal';
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
    // The input is the visible box (appearance-none). The check mark has to be
    // a following sibling, not a child, for peer-checked to reveal it.
    return html`
      <label
        class="vdocs:inline-flex vdocs:items-center vdocs:gap-2 vdocs:font-sans vdocs:cursor-pointer vdocs:has-disabled:cursor-default vdocs:has-disabled:opacity-50">
        <span class="vdocs:relative vdocs:inline-flex vdocs:shrink-0">
          <input
            type="checkbox"
            name=${this.name || nothing}
            value=${this.value || nothing}
            .checked=${live(this.checked)}
            ?disabled=${this.disabled}
            class="vdocs:peer vdocs:appearance-none vdocs:m-0 vdocs:shrink-0 vdocs:cursor-pointer vdocs:rounded-[2px] vdocs:border-2 vdocs:border-solid vdocs:bg-transparent vdocs:checked:bg-primary vdocs:checked:border-primary vdocs:disabled:cursor-default ${SIZE_CLASSES[this.size].box} ${THEME_CLASSES[this.theme]}"
            @change=${this.handleChange} />
          ${checkMark(`vdocs:pointer-events-none vdocs:absolute vdocs:inset-0 vdocs:m-auto vdocs:hidden vdocs:peer-checked:block vdocs:text-white ${SIZE_CLASSES[this.size].check}`)}
        </span>
        ${this.label ? html`<span class="vdocs:text-sm">${this.label}</span>` : nothing}
      </label>`;
  }
}

register('vdocs-checkbox', VdocsCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-checkbox': VdocsCheckbox;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-checked-change': CustomEvent<{ checked: boolean }>;
  }
}
