import type { ITemplate } from '@verdocs/js-sdk';
import Tabs, { type ITab } from '../../controls/Tabs';

/** The steps in the template builder, in presentation order. */
export type TVerdocsBuildStep = 'attachments' | 'roles' | 'fields' | 'preview';

export interface TemplateBuildTabsProps {
  /** The step to show as selected. */
  selectedStep: TVerdocsBuildStep;
  /**
   * The template being built. Steps unlock as it gains content: Workflow needs
   * a document, Fields needs a role, and Preview needs a field. Omit it (e.g.
   * before the template is created) to leave only Attachments enabled.
   */
  template?: ITemplate | null;
  /** Called when the user selects a different, enabled step. */
  onSelectStep?: (step: TVerdocsBuildStep) => void;
}

const STEP_IDS: TVerdocsBuildStep[] = ['attachments', 'roles', 'fields', 'preview'];

/**
 * The step strip for the template builder. This is a controlled, presentational
 * component: the parent owns the selected step and the template whose content
 * gates step availability. The legacy component loaded the template itself and
 * emitted sdkError; the port leaves data loading to the parent (pair it with
 * useTemplate) and composes the design-system Tabs control instead of the
 * legacy arrow strip.
 */
export default function TemplateBuildTabs({ selectedStep, template, onSelectStep }: TemplateBuildTabsProps) {
  // Same gating chain as the legacy builder: each step requires the previous
  // one to have produced content.
  const canEditRoles = (template?.documents || []).length > 0;
  const canEditFields = canEditRoles && (template?.roles || []).length > 0;
  const canPreview = canEditFields && (template?.fields || []).length > 0;

  const tabs: ITab[] = [
    { id: 'attachments', label: 'Attachments' },
    { id: 'roles', label: 'Workflow', disabled: !canEditRoles },
    { id: 'fields', label: 'Fields', disabled: !canEditFields },
    { id: 'preview', label: 'Preview & Send', disabled: !canPreview },
  ];

  return (
    <div className="vdocs:w-full vdocs:bg-surface vdocs:border-0 vdocs:border-b vdocs:border-solid vdocs:border-edge-light vdocs:px-2.5 vdocs:pt-1.5">
      <Tabs
        tabs={tabs}
        selectedTab={STEP_IDS.indexOf(selectedStep)}
        onSelectTab={tab => onSelectStep?.(tab.id as TVerdocsBuildStep)}
      />
    </div>
  );
}
