import { html, nothing } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * Display a simple progress bar in a style consistent with the design system.
 *
 * ```html
 * <vdocs-progress-bar label="Uploading..." show-percent percent="25"></vdocs-progress-bar>
 * ```
 */
export class VdocsProgressBar extends VdocsElement {
  static override properties = {
    label: { type: String },
    showPercent: { type: Boolean, attribute: 'show-percent' },
    percent: { type: Number },
  };

  /** Optional label to display above the bar. */
  declare label: string;
  /** If true, the progress percentage will be displayed above the bar. */
  declare showPercent: boolean;
  /** The current progress value (0-100). */
  declare percent: number;

  constructor() {
    super();
    this.label = '';
    this.showPercent = false;
    this.percent = 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override render() {
    const widthPercent = Math.ceil(Math.min(Math.max(this.percent, 0), 100));

    return html`
      <div class="vdocs:font-sans vdocs:w-full vdocs:box-border vdocs:flex vdocs:flex-col">
        ${this.label || this.showPercent ?
          html`
            <div class="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:mb-2">
              ${this.label ? html`<div class="vdocs:text-sm vdocs:font-semibold vdocs:text-ink">${this.label}</div>` : nothing}
              ${this.showPercent ? html`<div class="vdocs:text-sm vdocs:font-semibold vdocs:text-ink">${this.percent}%</div>` : nothing}
            </div>` :
          nothing}

        <div
          role="progressbar"
          aria-label=${this.label || 'Progress'}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow=${widthPercent}
          class="vdocs:flex vdocs:h-2.5 vdocs:rounded-row vdocs:bg-edge-light">
          <div class="vdocs:rounded-row vdocs:bg-primary" style="width: ${widthPercent}%"></div>
        </div>
      </div>`;
  }
}

register('vdocs-progress-bar', VdocsProgressBar);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-progress-bar': VdocsProgressBar;
  }
}
