import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';
import { StarOutlineIcon, StarSolidIcon } from '../../controls/icons';
import { useToggleTemplateStar } from '../../hooks/useTemplates';
import { SDKError } from '../../types';

export interface TemplateStarProps {
  template: ITemplate;
  endpoint?: VerdocsEndpoint;
  onSdkError?: (error: SDKError) => void;
}

/**
 * A clickable star that lets users mark frequently-used templates. Toggling
 * runs a mutation that invalidates template list queries on completion.
 * Internal to VerdocsTemplatesList.
 */
export default function TemplateStar({ template, endpoint, onSdkError }: TemplateStarProps) {
  const toggleStar = useToggleTemplateStar(endpoint);

  return (
    <div className="vdocs:flex vdocs:items-center vdocs:gap-1.5">
      <button
        type="button"
        aria-label={template.star_counter ? 'Unstar template' : 'Star template'}
        aria-pressed={!!template.star_counter}
        disabled={toggleStar.isPending}
        onClick={e => {
          e.stopPropagation();
          toggleStar.mutate(template.id, {
            onError: error => onSdkError?.(new SDKError(error.message)),
          });
        }}
        className={`vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-primary ${toggleStar.isPending ? 'vdocs:opacity-40' : ''}`}>
        {template.star_counter ? <StarSolidIcon className="vdocs:size-6" /> : <StarOutlineIcon className="vdocs:size-6" />}
      </button>
      <div className="vdocs:text-sm vdocs:text-muted vdocs:min-w-5">
        {template.star_counter || '--'}
      </div>
    </div>
  );
}
