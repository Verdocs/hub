import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * Display a small loading spinner.
 *
 * ```html
 * <vdocs-spinner mode="dark" size="24"></vdocs-spinner>
 * ```
 */
export class VdocsSpinner extends VdocsElement {
  static override properties = {
    size: { type: Number },
    mode: { type: String },
  };

  /** Diameter of the spinner in pixels. */
  declare size: number;
  /** Light spinners suit dark backgrounds, dark spinners suit light ones. */
  declare mode: 'light' | 'dark';

  constructor() {
    super();
    this.size = 32;
    this.mode = 'light';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  override render() {
    const modeClasses = this.mode === 'light' ? 'vdocs:border-white/30 vdocs:border-t-white' : 'vdocs:border-ink/30 vdocs:border-t-ink';

    return html`
      <div
        role="status"
        aria-label="Loading"
        class="vdocs:animate-spin vdocs:rounded-full vdocs:border-[3px] ${modeClasses}"
        style="width: ${this.size}px; height: ${this.size}px; flex: 0 0 ${this.size}px"></div>`;
  }
}

register('vdocs-spinner', VdocsSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-spinner': VdocsSpinner;
  }
}
