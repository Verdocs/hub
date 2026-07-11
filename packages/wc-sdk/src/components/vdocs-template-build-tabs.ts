import { html } from 'lit';
import type { ITemplate } from '@verdocs/js-sdk';
import type { ITab, ITabSelectEvent } from '../controls/vdocs-tabs.js';
import type { TVerdocsBuildStep } from './template-events.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';
import '../controls/vdocs-tabs.js';

const STEP_IDS: TVerdocsBuildStep[] = [ 'attachments', 'roles', 'fields', 'preview' ];

/**
 * The step strip for the template builder. Controlled and presentational: the
 * host owns the selected step and the template whose content gates step
 * availability (Workflow needs a document, Fields needs a role, Preview needs a
 * field). Composes vdocs-tabs, mirroring the react-sdk port, which loads no
 * data of its own; pair it with a template detail query in the host.
 *
 * @fires vdocs-select-step - Fired with the newly selected step in detail (react-sdk's onSelectStep).
 */
export class VdocsTemplateBuildTabs extends VdocsElement {
  static override properties = {
    selectedStep: { type: String, attribute: 'selected-step' },
    template: { attribute: false },
  };

  /** The step to show as selected. */
  declare selectedStep: TVerdocsBuildStep;
  /** The template being built. Omit it (before the template is created) to leave only Attachments enabled. Property-only. */
  declare template?: ITemplate | null;

  constructor() {
    super();
    this.selectedStep = 'attachments';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private handleSelectTab(e: CustomEvent<ITabSelectEvent>) {
    this.emit<TVerdocsBuildStep>('vdocs-select-step', STEP_IDS[e.detail.index] as TVerdocsBuildStep);
  }

  override render() {
    // Same gating chain as the legacy builder: each step requires the previous
    // one to have produced content.
    const canEditRoles = (this.template?.documents || []).length > 0;
    const canEditFields = canEditRoles && (this.template?.roles || []).length > 0;
    const canPreview = canEditFields && (this.template?.fields || []).length > 0;

    const tabs: ITab[] = [
      { id: 'attachments', label: 'Attachments' },
      { id: 'roles', label: 'Workflow', disabled: !canEditRoles },
      { id: 'fields', label: 'Fields', disabled: !canEditFields },
      { id: 'preview', label: 'Preview & Send', disabled: !canPreview },
    ];

    return html`
      <div class="vdocs:w-full vdocs:bg-surface vdocs:border-0 vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-2.5 vdocs:pt-1.5">
        <vdocs-tabs
          .tabs=${tabs}
          .selectedTab=${Math.max(STEP_IDS.indexOf(this.selectedStep), 0)}
          @vdocs-select-tab=${this.handleSelectTab}></vdocs-tabs>
      </div>`;
  }
}

register('vdocs-template-build-tabs', VdocsTemplateBuildTabs);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-template-build-tabs': VdocsTemplateBuildTabs;
  }
}
