import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

const SIZE_CLASSES: Record<'small' | 'normal', string> = {
  normal: 'vdocs:size-10 vdocs:p-1.5 vdocs:rounded-ctl',
  small: 'vdocs:size-[34px] vdocs:p-1 vdocs:rounded-[2px]',
};

/**
 * Display a single button that can be toggled on and off by clicking it. This
 * is a controlled element: the host owns active and updates it as vdocs-toggle
 * fires with the requested state.
 *
 * @fires vdocs-toggle - Fired when the button is clicked, with the requested state in detail as { active }.
 */
export class VdocsToggleButton extends VdocsElement {
  static override properties = {
    active: { type: Boolean },
    icon: { attribute: false },
    label: { type: String },
    size: { type: String },
  };

  /** Whether the button renders pressed. */
  declare active: boolean;
  /** Icon template to render as the button face. When set, label becomes the accessible name only. Property-only. */
  declare icon?: TemplateResult;
  /** Text to render as the button face when no icon is given. */
  declare label: string;
  /** Small buttons suit dialogs and other compact regions. */
  declare size: 'small' | 'normal';

  constructor() {
    super();
    this.active = false;
    this.label = '';
    this.size = 'normal';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  private handleToggle(e: Event) {
    // The legacy control stopped propagation so a toggle never doubles as a
    // click on whatever hosts the button (field toolbars). Keep that contract.
    e.stopPropagation();
    this.emit('vdocs-toggle', { active: !this.active });
  }

  override render() {
    return html`
      <button
        type="button"
        aria-pressed=${this.active}
        aria-label=${this.icon && this.label ? this.label : nothing}
        @click=${this.handleToggle}
        class="vdocs:font-sans vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:border-none vdocs:cursor-pointer vdocs:[&_svg]:max-w-full vdocs:[&_svg]:max-h-full vdocs:[&_svg]:fill-current ${SIZE_CLASSES[this.size] ?? SIZE_CLASSES.normal} ${this.active ?
          'vdocs:bg-primary vdocs:text-canvas' :
          'vdocs:bg-edge-light vdocs:text-ink'}">
        ${this.icon ?? this.label}
      </button>`;
  }
}

register('vdocs-toggle-button', VdocsToggleButton);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-toggle-button': VdocsToggleButton;
  }
}
