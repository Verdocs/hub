import type { HTMLAttributes } from 'react';
import type { IOrganization } from '@verdocs/js-sdk';
import { BuildingOfficeIcon } from './icons';

export interface OrganizationCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The organization to display. */
  organization: IOrganization;
}

/**
 * Display a small summary card describing an organization: its logo (with a
 * placeholder icon fallback), name, and web site link if one is set.
 */
export default function OrganizationCard({ organization, className = '', ...rest }: OrganizationCardProps) {
  return (
    <div
      className={`vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3.5 vdocs:px-[15px] vdocs:py-[7px] vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-lg vdocs:font-sans vdocs:text-ink ${className}`}
      {...rest}>
      {organization.thumbnail_url ? (
        <img src={organization.thumbnail_url} alt="Logo" className="vdocs:size-6 vdocs:shrink-0" />
      ) : (
        <BuildingOfficeIcon className="vdocs:size-6 vdocs:shrink-0 vdocs:text-edge" />
      )}

      <div className="vdocs:flex vdocs:flex-col vdocs:overflow-hidden">
        <div className="vdocs:text-base vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">
          {organization.name}
        </div>

        {organization.url && (
          <a
            href={organization.url}
            target="_blank"
            rel="noreferrer nofollow"
            className="vdocs:text-sm vdocs:text-accent vdocs:no-underline vdocs:hover:underline vdocs:whitespace-nowrap vdocs:text-ellipsis vdocs:overflow-hidden">
            {organization.url}
          </a>
        )}
      </div>
    </div>
  );
}
