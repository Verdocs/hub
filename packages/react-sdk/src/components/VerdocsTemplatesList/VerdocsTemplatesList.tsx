import { canPerformTemplateAction } from '@verdocs/js-sdk';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import type { IGetTemplatesParams, ITemplate, TSortTemplateBy, TTemplateVisibilityFilter, VerdocsEndpoint } from '@verdocs/js-sdk';
import { BuildingOfficeIcon, CalendarCreatedIcon, CalendarLastUsedIcon, CalendarUpdatedIcon, EnvelopeIcon, GlobeAltIcon, LockClosedIcon } from '../../controls/icons';
import { QuickFilter, type IFilterOption } from '../../controls/QuickFilter';
import { Dropdown, type IMenuOption } from '../../controls/Dropdown';
import { useResolvedEndpoint } from '../../provider/VerdocsContext';
import { SDKError, type ITemplateEvent } from '../../types';
import { useTemplates } from '../../hooks/useTemplates';
import { Pagination } from '../../controls/Pagination';
import { TextInput } from '../../controls/TextInput';
import { useSession } from '../../hooks/useSession';
import { Spinner } from '../../controls/Spinner';
import { TemplateStar } from './TemplateStar';

export type TStarredFilter = 'all' | 'starred' | 'unstarred';

export type TAllowedTemplateAction = 'send' | 'signnow' | 'submitted' | 'link' | 'edit';

export interface VerdocsTemplatesListProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The initial visibility setting to filter by. */
  visibility?: TTemplateVisibilityFilter;
  /** The initial starred setting to filter by. */
  starred?: TStarredFilter;
  /** The initial sort order to display. */
  sort?: TSortTemplateBy;
  /** The initial name filter, if any. */
  name?: string;
  /** The row actions to offer in each row's dropdown menu. */
  allowedActions?: TAllowedTemplateAction[];
  /** Whether pagination should be enabled. */
  showPagination?: boolean;
  /** The number of rows to display per page. */
  rowsPerPage?: number;
  /** The initial page number to select. */
  initialPage?: number;

  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
  /**
   * Called when the user clicks a template row, or selects "Preview / Send"
   * from the row menu. Typically used to navigate to the template preview.
   */
  onViewTemplate?: (event: ITemplateEvent) => void;
  /** Called when the user selects "Submissions" from the row menu. */
  onSubmittedData?: (event: ITemplateEvent) => void;
  /** Called when the user selects "Edit" from the row menu. */
  onEditTemplate?: (event: ITemplateEvent) => void;
  /** Called when the user changes the sort order. Useful for saving preferences. */
  onChangeSort?: (sort: TSortTemplateBy) => void;
  /** Called when the user changes the visibility filter. Useful for saving preferences. */
  onChangeVisibility?: (visibility: TTemplateVisibilityFilter) => void;
  /** Called when the user changes the starred filter. Useful for saving preferences. */
  onChangeStarred?: (starred: TStarredFilter) => void;
  /**
   * Called when the user commits a change to the name filter. Fired on blur
   * rather than every keystroke; unlike the other filters, search terms are
   * usually not worth persisting.
   */
  onChangeName?: (name: string) => void;
}

const VisibilityFilters: IFilterOption[] = [
  { value: 'private_shared', label: 'Personal + Shared' },
  { value: 'private', label: 'Personal' },
  { value: 'shared', label: 'Shared' },
  { value: 'public', label: 'Public' },
];

const StarredFilters: IFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'starred', label: 'Starred' },
  { value: 'unstarred', label: 'Not Starred' },
];

const SortOptions: IFilterOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'last_used_at', label: 'Last Used' },
  { value: 'counter', label: 'Most Used' },
  { value: 'star_counter', label: 'Most Starred' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short' });

/**
 * Display a list of the templates in the caller's account, with filtering,
 * sorting, starring, and pagination. Row-level actions fire callbacks so the
 * host application can route to its own views.
 */
export const VerdocsTemplatesList: FC<VerdocsTemplatesListProps> = ({
  endpoint,
  visibility: initialVisibility = 'private_shared',
  starred: initialStarred = 'all',
  sort: initialSort = 'updated_at',
  name: initialName = '',
  allowedActions = ['send', 'signnow', 'submitted', 'link', 'edit'],
  showPagination = true,
  rowsPerPage = 10,
  initialPage = 0,
  onSdkError,
  onViewTemplate,
  onSubmittedData,
  onEditTemplate,
  onChangeSort,
  onChangeVisibility,
  onChangeStarred,
  onChangeName,
}) => {
  const resolvedEndpoint = useResolvedEndpoint(endpoint);
  const { profile } = useSession(endpoint);

  const [visibility, setVisibility] = useState(initialVisibility);
  const [starred, setStarred] = useState(initialStarred);
  const [sort, setSort] = useState(initialSort);
  const [name, setName] = useState(initialName);
  const [localNameFilter, setLocalNameFilter] = useState(initialName);
  const [selectedPage, setSelectedPage] = useState(initialPage);

  const params = useMemo(() => {
    const queryParams: IGetTemplatesParams = {
      visibility,
      sort_by: sort,
      page: selectedPage,
      rows: rowsPerPage,
    };

    if (starred !== 'all') {
      queryParams.is_starred = starred === 'starred';
    }

    if (name.trim() !== '') {
      queryParams.q = name.trim();
    }

    return queryParams;
  }, [visibility, starred, sort, name, selectedPage, rowsPerPage]);

  const query = useTemplates(params, endpoint);

  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (query.error) {
      const error = query.error as { message: string; response?: { status?: number; data?: unknown } };
      onSdkErrorRef.current?.(new SDKError(error.message, error.response?.status, error.response?.data));
    }
  }, [query.error]);

  const templates = query.data?.templates ?? [];
  const count = query.data?.count ?? 0;

  // In addition to the server query we also filter locally. This provides a
  // faster UI update while typing; the commit on blur re-queries the server
  // for any records that newly qualify.
  const locallyFilteredTemplates = !localNameFilter
    ? templates
    : templates.filter(t => t.name.toLowerCase().includes(localNameFilter.toLowerCase()));

  const dateToShow = sort === 'created_at' ? 'created_at' : sort === 'updated_at' ? 'updated_at' : 'last_used_at';

  const handleMenuSelect = (option: IMenuOption, template: ITemplate) => {
    const event: ITemplateEvent = { endpoint: resolvedEndpoint, template };
    switch (option.id) {
      case 'send':
        onViewTemplate?.(event);
        break;
      case 'submitted':
        onSubmittedData?.(event);
        break;
      case 'edit':
        onEditTemplate?.(event);
        break;
      default:
        break;
    }
  };

  const buildMenuOptions = (template: ITemplate): IMenuOption[] => {
    const menuOptions: IMenuOption[] = [];
    const canRead = canPerformTemplateAction(profile, 'read', template).canPerform;

    if (allowedActions.includes('send')) {
      menuOptions.push({ label: 'Preview / Send', id: 'send', disabled: !canRead });
    }

    if (allowedActions.includes('signnow')) {
      // Not yet available; kept visible so users can discover it is coming.
      menuOptions.push({ label: 'Sign Now', id: 'signnow', disabled: true });
    }

    if (allowedActions.includes('submitted')) {
      menuOptions.push({ label: '' });
      menuOptions.push({ label: 'Submissions', id: 'submitted', disabled: !canRead });
    }

    if (allowedActions.includes('edit')) {
      menuOptions.push({ label: '' });
      menuOptions.push({ label: 'Edit', id: 'edit', disabled: !canPerformTemplateAction(profile, 'write', template).canPerform });
    }

    return menuOptions;
  };

  return (
    <div className="vdocs:flex vdocs:flex-col vdocs:p-2.5 vdocs:rounded-md vdocs:font-sans vdocs:text-ink">
      <div className="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:gap-x-3 vdocs:gap-y-1 vdocs:mb-2.5">
        <div className="vdocs:w-40">
          <TextInput
            value={localNameFilter}
            clearable
            autoComplete="off"
            placeholder="Filter by Name..."
            className="vdocs:mb-0"
            onChange={e => setLocalNameFilter(e.target.value)}
            onBlur={e => {
              const committed = e.target.value.trim();
              setName(committed);
              setLocalNameFilter(committed);
              setSelectedPage(0);
              onChangeName?.(committed);
            }}
            onClear={() => {
              setName('');
              setLocalNameFilter('');
              setSelectedPage(0);
              onChangeName?.('');
            }}
          />
        </div>

        <QuickFilter
          label="Visibility"
          value={visibility}
          options={VisibilityFilters}
          onChange={option => {
            setVisibility(option.value as TTemplateVisibilityFilter);
            setSelectedPage(0);
            onChangeVisibility?.(option.value as TTemplateVisibilityFilter);
          }}
        />

        <QuickFilter
          label="Starred"
          value={starred}
          options={StarredFilters}
          onChange={option => {
            setStarred(option.value as TStarredFilter);
            setSelectedPage(0);
            onChangeStarred?.(option.value as TStarredFilter);
          }}
        />

        <QuickFilter
          label="Sort By"
          value={sort}
          options={SortOptions}
          onChange={option => {
            setSort(option.value as TSortTemplateBy);
            onChangeSort?.(option.value as TSortTemplateBy);
          }}
        />

        {query.isFetching && query.data && <Spinner mode="dark" size={24} />}
        <div className="vdocs:flex vdocs:flex-1" />
      </div>

      {query.isPending && (
        <div>
          {Array.from({ length: rowsPerPage }, (_, i) => (
            <div key={i} className="vdocs:h-12 vdocs:my-1 vdocs:rounded-row vdocs:bg-canvas vdocs:animate-pulse" />
          ))}
        </div>
      )}

      {locallyFilteredTemplates.map(template => {
        const date = template[dateToShow];

        return (
          <div
            key={template.id}
            className="vdocs:w-full vdocs:my-0.5 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-surface vdocs:rounded-row vdocs:cursor-pointer vdocs:hover:bg-accent-light/10 vdocs:hover:border-accent-light"
            onClick={() => onViewTemplate?.({ endpoint: resolvedEndpoint, template })}>
            <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-3 vdocs:px-3.5 vdocs:py-2">
              <TemplateStar template={template} endpoint={endpoint} onSdkError={onSdkError} />

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
              <div className="vdocs:flex-1 vdocs:text-base vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
                {template.name}
              </div>

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
              <div className="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap">
                <EnvelopeIcon title="Usage Counter" className="vdocs:size-6" />
                {template.counter || '--'}
              </div>

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
              <div className="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-28">
                {dateToShow === 'created_at' && <CalendarCreatedIcon title="Created" className="vdocs:size-6" />}
                {dateToShow === 'updated_at' && <CalendarUpdatedIcon title="Last Updated" className="vdocs:size-6" />}
                {dateToShow === 'last_used_at' && <CalendarLastUsedIcon title="Last Used" className="vdocs:size-6" />}
                {date ? dateFormatter.format(new Date(date)) : 'Never'}
              </div>

              <div className="vdocs:border-r vdocs:border-solid vdocs:border-edge-light vdocs:h-7 vdocs:max-md:hidden" />
              <div className="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:text-sm vdocs:text-muted vdocs:whitespace-nowrap vdocs:min-w-20">
                {template.is_public && (
                  <>
                    <GlobeAltIcon className="vdocs:size-6" />
                    Public
                  </>
                )}
                {!template.is_public && !template.is_personal && (
                  <>
                    <LockClosedIcon className="vdocs:size-6" />
                    Private
                  </>
                )}
                {!template.is_public && template.is_personal && (
                  <>
                    <BuildingOfficeIcon className="vdocs:size-6" />
                    Shared
                  </>
                )}
              </div>

              <Dropdown options={buildMenuOptions(template)} onSelect={option => handleMenuSelect(option, template)} />
            </div>
          </div>
        );
      })}

      {!query.isPending && !templates.length && (
        <div className="vdocs:text-xl vdocs:text-center vdocs:mt-4 vdocs:px-20 vdocs:py-20 vdocs:border-2 vdocs:border-solid vdocs:border-edge">
          No matching templates found. Please adjust your filters and try again.
        </div>
      )}

      {!query.isPending && templates.length > 0 && showPagination && (
        <div className="vdocs:mt-5">
          <Pagination
            selectedPage={selectedPage}
            perPage={rowsPerPage}
            itemCount={count}
            onSelectPage={setSelectedPage}
          />
        </div>
      )}
    </div>
  );
};
