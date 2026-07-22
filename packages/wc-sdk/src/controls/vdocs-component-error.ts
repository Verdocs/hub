import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * Render a simple error message. Other components render this when they cannot
 * proceed, e.g. after a failed data load.
 */
export class VdocsComponentError extends VdocsElement {
  static override properties = {
    message: { type: String },
  };

  /** The message to display. */
  declare message: string;

  constructor() {
    super();
    this.message = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override render() {
    return html`
      <div role="alert" class="vdocs:font-sans vdocs:flex vdocs:p-[15px] vdocs:items-center vdocs:justify-center">
        <div class="vdocs:flex-1 vdocs:h-[300px] vdocs:flex vdocs:text-lg vdocs:text-ink vdocs:box-border vdocs:px-5 vdocs:bg-surface vdocs:items-center vdocs:justify-center">
          ${this.message}
        </div>
      </div>`;
  }
}

register('vdocs-component-error', VdocsComponentError);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-component-error': VdocsComponentError;
  }
}
