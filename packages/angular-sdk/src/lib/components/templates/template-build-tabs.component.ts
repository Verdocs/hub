import type { ITemplate } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { VerdocsTabsComponent, type ITab } from '../../controls/tabs.component';

/** The steps in the template builder, in presentation order. */
export type TVerdocsBuildStep = 'attachments' | 'roles' | 'fields' | 'preview';

const STEP_IDS: TVerdocsBuildStep[] = [ 'attachments', 'roles', 'fields', 'preview' ];

/**
 * The step strip for the template builder. This is a controlled, presentational
 * component: the parent owns the selected step and the template whose content
 * gates step availability. The legacy component loaded the template itself and
 * emitted sdkError; the port leaves data loading to the parent (pair it with
 * VerdocsTemplateDetailService) and composes the design-system tabs control
 * instead of the legacy arrow strip. React's onSelectStep callback is this
 * component's selectStep output.
 */
@Component({
  selector: 'verdocs-template-build-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsTabsComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    <div class="vdocs:w-full vdocs:bg-surface vdocs:border-0 vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-2.5 vdocs:pt-1.5">
      <verdocs-tabs [tabs]="tabs()" [selectedTab]="selectedIndex()" (selectedTabChange)="onSelectTab($event)" />
    </div>
  `,
})
export class VerdocsTemplateBuildTabsComponent {
  /** The step to show as selected. */
  readonly selectedStep = input.required<TVerdocsBuildStep>();
  /**
   * The template being built. Steps unlock as it gains content: Workflow needs
   * a document, Fields needs a role, and Preview needs a field. Omit it (e.g.
   * before the template is created) to leave only Attachments enabled.
   */
  readonly template = input<ITemplate | null>();

  /** Emitted when the user selects a different, enabled step. */
  readonly selectStep = output<TVerdocsBuildStep>();

  protected readonly selectedIndex = computed(() => STEP_IDS.indexOf(this.selectedStep()));

  protected readonly tabs = computed<ITab[]>(() => {
    // Same gating chain as the legacy builder: each step requires the previous
    // one to have produced content.
    const template = this.template();
    const canEditRoles = (template?.documents || []).length > 0;
    const canEditFields = canEditRoles && (template?.roles || []).length > 0;
    const canPreview = canEditFields && (template?.fields || []).length > 0;

    return [
      { id: 'attachments', label: 'Attachments' },
      { id: 'roles', label: 'Workflow', disabled: !canEditRoles },
      { id: 'fields', label: 'Fields', disabled: !canEditFields },
      { id: 'preview', label: 'Preview & Send', disabled: !canPreview },
    ];
  });

  protected onSelectTab(index: number) {
    const step = STEP_IDS[index];
    if (step) {
      this.selectStep.emit(step);
    }
  }
}
