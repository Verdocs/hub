import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export type TTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const TOOLTIP_PLACEMENT_CLASSES: Record<TTooltipPlacement, string> = {
  top: 'vdocs:bottom-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mb-1.5',
  bottom: 'vdocs:top-full vdocs:left-1/2 vdocs:-translate-x-1/2 vdocs:mt-1.5',
  // The wider gap on the left matches the legacy offset used by the floating page menu.
  left: 'vdocs:right-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:mr-5',
  right: 'vdocs:left-full vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:ml-1.5',
};

const ARROW_PLACEMENT_CLASSES: Record<TTooltipPlacement, string> = {
  top: 'vdocs:bottom-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  bottom: 'vdocs:top-[-4px] vdocs:left-1/2 vdocs:-ml-1',
  left: 'vdocs:right-[-4px] vdocs:top-1/2 vdocs:-mt-1',
  right: 'vdocs:left-[-4px] vdocs:top-1/2 vdocs:-mt-1',
};

// aria-describedby needs a page-unique id per instance, and light-DOM ids land
// in the host page, so a module counter does the job.
let nextTooltipId = 0;

/**
 * Displays a clickable toolbar icon. Upon hover or focus, a tooltip will be
 * displayed with the supplied text. Supply the icon template through the
 * `icon` property and listen for plain click events on the element (React's
 * onClick passthrough is the native click here):
 *
 * ```ts
 * const icon = document.createElement('vdocs-toolbar-icon');
 * icon.text = 'Copy';
 * icon.icon = copyIcon({ className: 'vdocs:size-5' });
 * icon.addEventListener('click', () => copyLink());
 * ```
 */
export class VdocsToolbarIcon extends VdocsElement {
  static override properties = {
    text: { type: String },
    placement: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    icon: { attribute: false },
    showing: { state: true },
  };

  /** Tooltip text to display on hover/focus. */
  declare text: string;
  /** Which side of the icon the tooltip appears on. */
  declare placement: TTooltipPlacement;
  /** The native button type. */
  declare type: 'button' | 'submit' | 'reset';
  declare disabled: boolean;
  /** The icon template to display. Property-only. */
  declare icon?: TemplateResult;

  private declare showing: boolean;

  private tooltipId = `vdocs-toolbar-tooltip-${nextTooltipId++}`;

  constructor() {
    super();
    this.text = '';
    this.placement = 'bottom';
    this.type = 'button';
    this.disabled = false;
    this.showing = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:font-sans', 'vdocs:relative', 'vdocs:inline-flex', 'vdocs:items-center', 'vdocs:justify-center');
  }

  private show() {
    this.showing = true;
  }

  private hide() {
    this.showing = false;
  }

  override render() {
    const placement = TOOLTIP_PLACEMENT_CLASSES[this.placement] ? this.placement : 'bottom';

    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled}
        aria-label=${this.text || nothing}
        aria-describedby=${this.tooltipId}
        class="vdocs:inline-flex vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-muted"
        @mouseenter=${this.show}
        @mouseleave=${this.hide}
        @focus=${this.show}
        @blur=${this.hide}>
        ${this.icon ?? nothing}
      </button>

      ${this.showing && !!this.text ?
        html`
          <span
            id=${this.tooltipId}
            role="tooltip"
            class="vdocs:absolute vdocs:z-[20000] vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:bg-surface vdocs:px-2.5 vdocs:py-[5px] vdocs:text-[13px] vdocs:font-bold vdocs:text-ink vdocs:shadow-[0_0_10px_1px_#999999] ${TOOLTIP_PLACEMENT_CLASSES[placement]}">
            ${this.text}
            <span class="vdocs:absolute vdocs:size-2 vdocs:rotate-45 vdocs:bg-surface ${ARROW_PLACEMENT_CLASSES[placement]}"></span>
          </span>` :
        nothing}`;
  }
}

register('vdocs-toolbar-icon', VdocsToolbarIcon);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-toolbar-icon': VdocsToolbarIcon;
  }
}
