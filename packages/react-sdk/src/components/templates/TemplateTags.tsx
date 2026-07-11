import type { HTMLAttributes } from 'react';

export interface TemplateTagsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The tags to display. */
  tags?: string[];
}

/**
 * Display a template's tags as a row of small chips. Display-only: tags are
 * assigned to templates via the API.
 */
export default function TemplateTags({ tags = [], className = '', ...rest }: TemplateTagsProps) {
  return (
    <div className={`vdocs:font-sans ${className}`} {...rest}>
      {tags.map(tag => (
        <span
          key={tag}
          className="vdocs:inline-block vdocs:box-border vdocs:h-7 vdocs:mx-1 vdocs:px-3 vdocs:pt-[5px] vdocs:pb-[7px] vdocs:text-xs vdocs:font-semibold vdocs:uppercase vdocs:rounded-row vdocs:text-ink vdocs:bg-canvas vdocs:border vdocs:border-solid vdocs:border-accent-light">
          {tag}
        </span>
      ))}
    </div>
  );
}
