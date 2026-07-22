import { html, nothing } from 'lit';
import type { IOrganization } from '@verdocs/js-sdk';
import { VdocsElement } from '../base/vdocs-element.js';
import { buildingOfficeIcon } from './icons/index.js';
import { register } from '../base/register.js';

/**
 * Display a small summary card describing an organization: its logo (with a
 * placeholder icon fallback), name, and web site link if one is set. The
 * organization goes through the `organization` property (objects never travel
 * as attributes).
 */
export class VdocsOrganizationCard extends VdocsElement {
  static override properties = {
    organization: { attribute: false },
  };

  /** The organization to display. Property-only. */
  declare organization?: IOrganization;

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add(
      'vdocs:flex', 'vdocs:flex-row', 'vdocs:items-center', 'vdocs:gap-3.5', 'vdocs:px-[15px]', 'vdocs:py-[7px]', 'vdocs:bg-surface', 'vdocs:border', 'vdocs:border-solid', 'vdocs:border-edge-light', 'vdocs:rounded-lg', 'vdocs:font-sans', 'vdocs:text-ink',
    );
  }

  override render() {
    if (!this.organization) {
      return nothing;
    }

    return html`
      ${this.organization.thumbnail_url ?
        html`<img src=${this.organization.thumbnail_url} alt="Logo" class="vdocs:size-6 vdocs:shrink-0" />` :
          buildingOfficeIcon({ className: 'vdocs:size-6 vdocs:shrink-0 vdocs:text-edge' })}

      <div class="vdocs:flex vdocs:flex-col vdocs:overflow-hidden">
        <div class="vdocs:text-base vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">
          ${this.organization.name}
        </div>

        ${this.organization.url ?
          html`
            <a
              href=${this.organization.url}
              target="_blank"
              rel="noreferrer nofollow"
              class="vdocs:text-sm vdocs:text-accent vdocs:no-underline vdocs:hover:underline vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">
              ${this.organization.url}
            </a>` :
          nothing}
      </div>`;
  }
}

register('vdocs-organization-card', VdocsOrganizationCard);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-organization-card': VdocsOrganizationCard;
  }
}
