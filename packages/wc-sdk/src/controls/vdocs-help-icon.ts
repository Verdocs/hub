import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { helpCircleIcon } from './icons/index.js';
import { register } from '../base/register.js';

// Stands in for React's useId: aria-describedby has to point at something
// unique per instance.
let nextTooltipId = 0;

/**
 * Displays a simple help icon. Upon hover or focus, a tooltip will be
 * displayed with help text.
 *
 * ```html
 * <vdocs-help-icon text="Recipients get a copy when the envelope completes."></vdocs-help-icon>
 * ```
 */
export class VdocsHelpIcon extends VdocsElement {
  static override properties = {
    text: { type: String },
    icon: { attribute: false },
    showing: { state: true },
  };

  /** Help text to display on hover/focus. */
  declare text: string;
  /** Optional icon template to display. If not supplied, a standard help icon will be shown. Property-only. */
  declare icon?: TemplateResult;

  private declare showing: boolean;

  private tooltipId = `vdocs-help-tooltip-${++nextTooltipId}`;

  constructor() {
    super();
    this.text = '';
    this.showing = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  private show() {
    this.showing = true;
  }

  private hide() {
    this.showing = false;
  }

  override render() {
    return html`
      <span class="vdocs:font-sans vdocs:relative vdocs:inline-block vdocs:opacity-30 vdocs:hover:opacity-100 vdocs:focus-within:opacity-100">
        <span
          role="img"
          aria-label="Help"
          aria-describedby=${this.tooltipId}
          tabindex="0"
          class="vdocs:inline-block vdocs:text-muted vdocs:outline-none"
          @mouseenter=${this.show}
          @mouseleave=${this.hide}
          @focus=${this.show}
          @blur=${this.hide}>
          ${this.icon ?? helpCircleIcon({ className: 'vdocs:size-6' })}
        </span>

        ${this.showing ?
          html`
            <span
              id=${this.tooltipId}
              role="tooltip"
              class="vdocs:absolute vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1 vdocs:z-[10005] vdocs:min-w-[200px] vdocs:max-w-[240px] vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-xs vdocs:font-medium vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999]">
              ${this.text}
              <span class="vdocs:absolute vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1 vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface"></span>
            </span>` :
          nothing}
      </span>`;
  }
}

register('vdocs-help-icon', VdocsHelpIcon);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-help-icon': VdocsHelpIcon;
  }
}
