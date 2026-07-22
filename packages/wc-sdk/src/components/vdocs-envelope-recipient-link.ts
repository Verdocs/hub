import { html, nothing } from 'lit';
import { formatFullName } from '@verdocs/js-sdk';
import type { IRecipient } from '@verdocs/js-sdk';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-button.js';

/**
 * Display a single recipient from an envelope, with the opportunity to copy an
 * in-person signing link for that recipient to use. The link itself is fetched
 * by the host (see vdocs-get-link); copying writes it to the clipboard.
 *
 * @fires vdocs-get-link - Fired with the IRecipient when the user clicks Get Link. The host fetches the link and sets the `link` property.
 * @fires vdocs-link-done - Fired when the user clicks Done to proceed to the next workflow step.
 */
export class VdocsEnvelopeRecipientLink extends VdocsElement {
  static override properties = {
    recipient: { attribute: false },
    link: { type: String },
    gettingLink: { type: Boolean, attribute: 'getting-link' },
  };

  /** The recipient to display. Property-only. */
  declare recipient: IRecipient;
  /** The recipient's in-person signing link, once the host has obtained one. */
  declare link: string;
  /** True while the host is fetching the link. Shown as a loading state on the Get Link button. */
  declare gettingLink: boolean;

  constructor() {
    super();
    this.link = '';
    this.gettingLink = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private handleCopy() {
    // Browsers block writes that aren't triggered by a user gesture, which is
    // why the copy happens here rather than automatically when the link loads.
    navigator.clipboard
      .writeText(this.link ?? '')
      .then(() => showToast('Link copied to clipboard!', { style: 'success', duration: 3000 }))
      .catch((e: Error) => showToast(`Unable to copy to clipboard: ${e.message}`, { style: 'error' }));
  }

  override render() {
    const fullName = formatFullName(this.recipient);

    return html`
      <div class="vdocs:flex vdocs:flex-col vdocs:w-[600px] vdocs:max-w-full vdocs:font-sans vdocs:text-lg vdocs:bg-surface vdocs:rounded-md vdocs:pt-7 vdocs:px-5 vdocs:pb-5">
        <div class="vdocs:text-xl vdocs:font-bold vdocs:text-ink vdocs:mb-2.5">In-Person Signing Link</div>

        <div class="vdocs:flex vdocs:flex-col vdocs:text-ink vdocs:mt-2 vdocs:mb-6">
          <div class="vdocs:text-sm vdocs:font-semibold vdocs:mb-2">${this.recipient?.role_name}</div>

          <div class="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-1.5">
            <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:h-[34px] vdocs:px-3 vdocs:text-base vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas">
              ${fullName} (${this.recipient?.email || this.recipient?.phone})
            </div>

            ${!this.link ?
              html`
                <vdocs-button
                  size="small"
                  variant="outline"
                  label=${this.gettingLink ? 'Loading...' : 'Get Link'}
                  ?disabled=${this.gettingLink}
                  @click=${() => this.emit<IRecipient>('vdocs-get-link', this.recipient)}></vdocs-button>` :
              nothing}
          </div>

          ${this.link ?
            html`
              <div class="vdocs:flex vdocs:flex-row vdocs:gap-1.5 vdocs:mt-1">
                <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:h-[34px] vdocs:px-3 vdocs:text-base vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
                  ${this.link}
                </div>
                <vdocs-button size="small" variant="outline" label="Copy" @click=${this.handleCopy}></vdocs-button>
              </div>` :
            nothing}
        </div>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:mt-2.5">
          <vdocs-button size="small" label="Done" class="vdocs:min-w-[120px]" @click=${() => this.emit('vdocs-link-done')}></vdocs-button>
        </div>
      </div>`;
  }
}

register('vdocs-envelope-recipient-link', VdocsEnvelopeRecipientLink);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-envelope-recipient-link': VdocsEnvelopeRecipientLink;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-get-link': CustomEvent<IRecipient>;
    'vdocs-link-done': CustomEvent<undefined>;
  }
}
