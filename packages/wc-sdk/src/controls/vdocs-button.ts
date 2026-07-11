import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export type TButtonSize = 'xsmall' | 'small' | 'normal' | 'medium' | 'large';
export type TButtonVariant = 'standard' | 'text' | 'outline';

const SIZE_CLASSES: Record<TButtonSize, string> = {
  xsmall: 'vdocs:h-[26px] vdocs:text-xs',
  small: 'vdocs:h-[34px] vdocs:text-[13px]',
  normal: 'vdocs:h-11 vdocs:text-sm',
  medium: 'vdocs:h-[52px] vdocs:text-base',
  large: 'vdocs:h-[60px] vdocs:text-xl',
};

const VARIANT_CLASSES: Record<TButtonVariant, string> = {
  standard:
    'vdocs:bg-primary vdocs:text-white vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary-dark vdocs:disabled:bg-disabled vdocs:disabled:text-white/70',
  outline:
    'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border vdocs:border-solid vdocs:border-primary vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled vdocs:disabled:border-disabled',
  text: 'vdocs:bg-transparent vdocs:text-primary-dark vdocs:border-none vdocs:rounded-ctl vdocs:hover:bg-primary/10 vdocs:disabled:text-disabled',
};

/**
 * A simple button, with consistent styling to other controls in the design
 * system. Renders a native button in light DOM, so type="submit" participates
 * in surrounding forms and plain click listeners work:
 *
 * ```html
 * <vdocs-button label="Sign Out"></vdocs-button>
 * ```
 */
export class VdocsButton extends VdocsElement {
  static override properties = {
    label: { type: String },
    size: { type: String },
    variant: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    startIcon: { attribute: false },
    endIcon: { attribute: false },
  };

  /** The label for the button. */
  declare label: string;
  /** The size (height) of the button. */
  declare size: TButtonSize;
  /** The display variant of the button. */
  declare variant: TButtonVariant;
  /** The native button type; use "submit" inside forms. */
  declare type: 'button' | 'submit';
  declare disabled: boolean;
  /** Optional prefix icon template. Property-only. */
  declare startIcon?: TemplateResult;
  /** Optional suffix icon template. Property-only. */
  declare endIcon?: TemplateResult;

  constructor() {
    super();
    this.label = '';
    this.size = 'normal';
    this.variant = 'standard';
    this.type = 'button';
    this.disabled = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  override updated() {
    // The inner button already ignores clicks when disabled, but without this
    // the host element would still receive them (pointer-events: none on the
    // button makes the host the click target), so host-level click listeners
    // would fire for a disabled control.
    this.classList.toggle('vdocs:pointer-events-none', this.disabled);
  }

  override render() {
    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled}
        class="vdocs:font-sans vdocs:font-medium vdocs:cursor-pointer vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:disabled:cursor-default vdocs:disabled:pointer-events-none ${SIZE_CLASSES[this.size]} ${VARIANT_CLASSES[this.variant]}">
        ${this.startIcon ? html`<span class="vdocs:mx-1 vdocs:[&>svg]:size-5">${this.startIcon}</span>` : nothing}
        <span class="vdocs:px-2.5">${this.label}</span>
        ${this.endIcon ? html`<span class="vdocs:mx-1 vdocs:[&>svg]:size-5">${this.endIcon}</span>` : nothing}
      </button>`;
  }
}

register('vdocs-button', VdocsButton);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-button': VdocsButton;
  }
}
