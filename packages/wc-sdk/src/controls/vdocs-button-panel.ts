import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import './vdocs-portal.js';

/**
 * Display an icon button that opens a floating panel of arbitrary content,
 * such as settings forms or metadata. The element's markup children become
 * the panel body, consumed once when the element first connects. The panel
 * is anchored to the button through vdocs-portal and closes when the user
 * clicks anywhere outside it.
 *
 * ```html
 * <vdocs-button-panel label="Field settings">
 *   <div>Field Settings</div>
 * </vdocs-button-panel>
 * ```
 */
export class VdocsButtonPanel extends VdocsElement {
  static override properties = {
    icon: { attribute: false },
    label: { type: String },
    open: { state: true },
  };

  /** The icon template rendered as the trigger button face. Property-only. */
  declare icon?: TemplateResult;
  /** Accessible name for the trigger button and its panel. */
  declare label: string;

  private declare open: boolean;

  private content?: ChildNode[];
  private trigger = createRef<HTMLButtonElement>();

  constructor() {
    super();
    this.label = 'Open panel';
    this.open = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block', 'vdocs:font-sans');

    // Markup children are the panel body. We consume them once, before Lit's
    // first render, then interpolate the same nodes into the portal whenever
    // the panel opens.
    if (!this.content) {
      this.content = Array.from(this.childNodes);
      this.replaceChildren();
    }
  }

  private toggleOpen() {
    this.open = !this.open;
  }

  private close() {
    this.open = false;
  }

  override render() {
    return html`
      <button
        ${ref(this.trigger)}
        type="button"
        aria-haspopup="dialog"
        aria-expanded=${this.open}
        aria-label=${this.label}
        @click=${this.toggleOpen}
        class="vdocs:inline-flex vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:opacity-60 vdocs:text-accent-light vdocs:hover:opacity-100 vdocs:[&_svg]:fill-current">
        ${this.icon}
      </button>

      ${this.open ?
        html`
          <vdocs-portal .anchor=${this.trigger.value} @vdocs-click-away=${this.close}>
            <div
              role="dialog"
              aria-label=${this.label}
              class="vdocs:w-80 vdocs:p-[15px] vdocs:text-sm vdocs:font-bold vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:rounded-ctl vdocs:shadow-lg">
              ${this.content}
            </div>
          </vdocs-portal>` :
        nothing}`;
  }
}

register('vdocs-button-panel', VdocsButtonPanel);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-button-panel': VdocsButtonPanel;
  }
}
