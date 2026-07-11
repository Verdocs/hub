import type { HTMLAttributes } from 'react';
import type { ITemplate } from '@verdocs/js-sdk';
import { EnvelopeIcon, FileCheckIcon, StarOutlineIcon } from '../../controls/icons';

export interface TemplateCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'> {
  /** The template to summarize. */
  template: ITemplate;
  /** Called when the user clicks the card. */
  onClick?: (template: ITemplate) => void;
}

/**
 * Display a summary card for a template: its name, the organization it lives
 * in, and its star, page, and usage counts.
 */
export default function TemplateCard({ template, onClick, className = '', ...rest }: TemplateCardProps) {
  return (
    <div
      onClick={() => onClick?.(template)}
      className={`vdocs:flex vdocs:flex-col vdocs:w-[320px] vdocs:h-[320px] vdocs:p-[25px] vdocs:box-border vdocs:bg-surface vdocs:font-sans vdocs:text-ink vdocs:shadow-[2px_2px_5px_rgba(51,54,75,0.05)] ${onClick ? 'vdocs:cursor-pointer' : ''} ${className}`}
      {...rest}>
      <span className="vdocs:text-lg vdocs:font-bold vdocs:mb-[7px]">
        {template.name}
      </span>

      <span className="vdocs:text-sm vdocs:font-bold vdocs:mb-1.5">
        {template.organization?.name || 'Public'}
      </span>

      <hr className="vdocs:w-full vdocs:h-px vdocs:mb-[17px] vdocs:bg-edge vdocs:border-none" />

      <div className="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:text-base">
        <div className="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
          <StarOutlineIcon title="Stars" className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
          <span>
            {template.star_counter}
          </span>
        </div>

        <div className="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:mr-2 vdocs:border-r vdocs:border-solid vdocs:border-edge">
          <FileCheckIcon title="Pages" className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
          <span>
            {template.documents?.[0]?.pages || 1}
          </span>
        </div>

        <div className="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2">
          <EnvelopeIcon title="Usage Counter" className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
          <span>
            {template.counter}
          </span>
        </div>
      </div>
    </div>
  );
}
