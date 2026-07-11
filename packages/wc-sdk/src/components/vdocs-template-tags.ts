import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * Display a template's tags as a row of small chips. Display-only: tags are
 * assigned to templates through the API, mirroring the react-sdk TemplateTags.
 *
 * ```html
 * <vdocs-template-tags></vdocs-template-tags>
 * ```
 */
export class VdocsTemplateTags extends VdocsElement {
  static override properties = {
    tags: { attribute: false },
  };

  /** The tags to display. Property-only (an array). */
  declare tags: string[];

  constructor() {
    super();
    this.tags = [];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:font-sans');
  }

  override render() {
    return html`
      ${this.tags.map(tag => html`
        <span
          class="vdocs:inline-block vdocs:box-border vdocs:h-7 vdocs:mx-1 vdocs:px-3 vdocs:pt-[5px] vdocs:pb-[7px] vdocs:text-xs vdocs:font-semibold vdocs:uppercase vdocs:rounded-row vdocs:text-ink vdocs:bg-canvas vdocs:border vdocs:border-solid vdocs:border-accent-light">
          ${tag}
        </span>`)}`;
  }
}

register('vdocs-template-tags', VdocsTemplateTags);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-tags': VdocsTemplateTags;
  }
}
