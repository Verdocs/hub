import { html, nothing } from 'lit';
import type { ITemplate } from '@verdocs/js-sdk';
import { envelopeIcon, fileCheckIcon } from '../controls/icons/index.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

/**
 * Display a summary card for a template: its name, the organization it lives
 * in, and its page and usage counts. Clicking the card fires
 * vdocs-select-template with the template in detail (react-sdk's onClick).
 *
 * The star count the react-sdk card shows is omitted here for the same reason
 * the templates list dropped its star column: star features are frozen pending
 * the retirement decision, so this mirror never grew one.
 *
 * @fires vdocs-select-template - Fired with the template in detail when the user clicks the card.
 */
export class VdocsTemplateCard extends VdocsElement {
  static override properties = {
    template: { attribute: false },
  };

  /** The template to summarize. Property-only. */
  declare template?: ITemplate;

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:inline-block');
  }

  private handleClick() {
    if (this.template) {
      this.emit<ITemplate>('vdocs-select-template', this.template);
    }
  }

  override render() {
    const template = this.template;
    if (!template) {
      return nothing;
    }

    return html`
      <div
        @click=${this.handleClick}
        class="vdocs:flex vdocs:flex-col vdocs:w-[320px] vdocs:h-[320px] vdocs:p-[25px] vdocs:box-border vdocs:bg-surface vdocs:font-sans vdocs:text-ink vdocs:cursor-pointer vdocs:shadow-[2px_2px_5px_rgba(51,54,75,0.05)]">
        <span class="vdocs:text-lg vdocs:font-bold vdocs:mb-[7px]">${template.name}</span>

        <span class="vdocs:text-sm vdocs:font-bold vdocs:mb-1.5">${template.organization?.name || 'Public'}</span>

        <hr class="vdocs:w-full vdocs:h-px vdocs:mb-[17px] vdocs:bg-edge vdocs:border-none" />

        <div class="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:text-base">
          <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
            ${fileCheckIcon({ className: 'vdocs:size-4 vdocs:shrink-0 vdocs:text-edge', title: 'Pages' })}
            <span>${template.documents?.[0]?.pages || 1}</span>
          </div>

          <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-end vdocs:gap-2">
            ${envelopeIcon({ className: 'vdocs:size-4 vdocs:shrink-0 vdocs:text-edge', title: 'Usage Counter' })}
            <span>${template.counter}</span>
          </div>
        </div>
      </div>`;
  }
}

register('vdocs-template-card', VdocsTemplateCard);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-card': VdocsTemplateCard;
  }
}
