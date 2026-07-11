import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getTemplateDocumentPageDisplayUri } from '@verdocs/js-sdk';
import type { IRole, ITemplate, ITemplateDocument, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint } from '../../provider/VerdocsContext';
import TemplateFieldProperties from './TemplateFieldProperties';
import ComponentError from '../../controls/ComponentError';
import FieldAttachment from '../../fields/FieldAttachment';
import TemplateDocumentPage from './TemplateDocumentPage';
import FieldSignature from '../../fields/FieldSignature';
import FieldTimestamp from '../../fields/FieldTimestamp';
import FieldCheckbox from '../../fields/FieldCheckbox';
import FieldDropdown from '../../fields/FieldDropdown';
import FieldTextarea from '../../fields/FieldTextarea';
import { useTemplate } from '../../hooks/useTemplates';
import FieldInitial from '../../fields/FieldInitial';
import FieldPayment from '../../fields/FieldPayment';
import FieldTextbox from '../../fields/FieldTextbox';
import FieldRadio from '../../fields/FieldRadio';
import FieldDate from '../../fields/FieldDate';
import Loader from '../../controls/Loader';
import Portal from '../../controls/Portal';
import { SDKError } from '../../types';

/** Reported through onTemplateUpdated whenever a field changes. */
export interface ITemplateFieldsEvent {
  endpoint: VerdocsEndpoint;
  template: ITemplate;
  event: 'updated-field' | 'deleted-field';
}

export interface TemplateFieldsProps {
  /** The ID of the template whose fields are displayed. */
  templateId: string;
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** Called when a field is updated or deleted, e.g. for cache invalidation in the host app. */
  onTemplateUpdated?: (event: ITemplateFieldsEvent) => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

// The legacy render switch, minus the Stencil store plumbing: each field type
// maps to its display component. Legacy promoted textboxes carrying a leading
// setting to textareas, and fell through to the bare field name for unknown
// types; both behaviors are kept. Payment was not in the legacy switch (it fell
// through to the name) but the port has FieldPayment, so it is mapped.
function fieldElement(field: ITemplateField, signerIndex: number) {
  const type = field.type === 'textbox' && (field.settings?.leading ?? 0) > 0 ? 'textarea' : field.type;

  // Fields are display-only on the builder canvas: disabled, sized to the
  // field's stored box, and click-transparent so clicks land on the settings
  // wrapper even over disabled inputs (which never fire mouse events).
  const common = {
    field,
    disabled: true,
    signerIndex,
    className: 'vdocs:pointer-events-none',
    style: { width: '100%', height: '100%' },
  };

  switch (type) {
    case 'signature':
      return <FieldSignature {...common} />;
    case 'initial':
      return <FieldInitial {...common} />;
    case 'textbox':
      return <FieldTextbox {...common} />;
    case 'textarea':
      return <FieldTextarea {...common} />;
    case 'date':
      return <FieldDate {...common} />;
    case 'timestamp':
      return <FieldTimestamp {...common} />;
    case 'dropdown':
      return <FieldDropdown {...common} />;
    case 'checkbox':
      return <FieldCheckbox {...common} />;
    case 'radio':
      return <FieldRadio {...common} />;
    case 'attachment':
      return <FieldAttachment {...common} />;
    case 'payment':
      return <FieldPayment {...common} />;
    default:
      return field.name;
  }
}

interface PlacedFieldProps {
  field: ITemplateField;
  signerIndex: number;
  onOpen: (field: ITemplateField, anchor: HTMLElement) => void;
}

// One positioned field on the page. Field x/y are PDF points with y measured
// up from the page bottom; inside TemplateDocumentPage's field layer those map
// straight to left/bottom. Clicking (or Enter/Space) opens the settings panel,
// replacing the legacy hover popover and interact.js dragging (rule 6).
function PlacedField({ field, signerIndex, onOpen }: PlacedFieldProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${field.name} settings`}
      onClick={e => onOpen(field, e.currentTarget)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(field, e.currentTarget);
        }
      }}
      className="vdocs:absolute vdocs:box-border vdocs:cursor-pointer vdocs:outline-offset-2 vdocs:focus-visible:outline-2 vdocs:focus-visible:outline-accent"
      style={{ left: field.x, bottom: field.y, width: field.width, height: field.height }}>
      {fieldElement(field, signerIndex)}
    </div>
  );
}

interface FieldsPageProps {
  document: ITemplateDocument;
  page: number;
  fields: ITemplateField[];
  roles: IRole[];
  endpoint: VerdocsEndpoint;
  onOpen: (field: ITemplateField, anchor: HTMLElement) => void;
}

function FieldsPage({ document, page, fields, roles, endpoint, onOpen }: FieldsPageProps) {
  // Page sizes are keyed by 1-based page number; US Letter when absent,
  // matching the legacy fallback.
  const pageSize = document.page_sizes?.[page] || { width: 612, height: 792 };

  const imageQuery = useQuery({
    queryKey: ['template-documents', document.id, 'page-image', page],
    queryFn: () => getTemplateDocumentPageDisplayUri(endpoint, document.id, page),
  });

  return (
    <TemplateDocumentPage
      pageImageUri={imageQuery.data}
      virtualWidth={pageSize.width}
      virtualHeight={pageSize.height}
      pageNumber={page}>
      {fields.map(field => (
        <PlacedField
          key={field.name}
          field={field}
          signerIndex={Math.max(roles.findIndex(role => role.name === field.role_name), 0)}
          onOpen={onOpen}
        />
      ))}
    </TemplateDocumentPage>
  );
}

/**
 * The field layout view of the template builder: every page of every document
 * in the template, with the template's fields drawn over them in their stored
 * positions and colored per role. Clicking a field opens TemplateFieldProperties
 * in a floating panel; saves and deletes go through the template structure
 * mutations, so the canvas refreshes from the updated template.
 *
 * Deviations from the legacy component, per docs/PORTING.md rule 6: interact.js
 * field dragging is not ported, and with it the add-field toolbar and
 * click-to-place mode (the builder-canvas authoring affordances). Fields are
 * repositioned and created through the API or a future builder embed.
 */
export default function TemplateFields({ templateId, endpoint, onTemplateUpdated, onSdkError }: TemplateFieldsProps) {
  const resolvedEndpoint = useResolvedEndpoint(endpoint);
  const query = useTemplate(templateId, endpoint);
  const [selectedField, setSelectedField] = useState<{ name: string; anchor: HTMLElement } | null>(null);

  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (query.error) {
      const error = query.error as { message: string; response?: { status?: number; data?: unknown } };
      onSdkErrorRef.current?.(new SDKError(error.message, error.response?.status, error.response?.data));
    }
  }, [query.error]);

  if (query.isPending) {
    return (
      <div className="vdocs:relative vdocs:min-h-[600px]">
        <Loader />
      </div>
    );
  }

  const template = query.data;
  if (!template) {
    return <ComponentError message="Unable to load template fields. Please verify you are signed in and try again." />;
  }

  const documents = template.documents || [];
  const fields = template.fields || [];
  const sortedRoles = [...(template.roles || [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  const handleOpen = (field: ITemplateField, anchor: HTMLElement) => {
    setSelectedField({ name: field.name, anchor });
  };

  // The legacy templateUpdated event carried a hand-merged copy of the
  // template; the payloads here match it. The query cache refresh happens in
  // the structure mutations, so these are purely host notifications.
  const handleSettingsChanged = (event: { fieldName: string; field: ITemplateField }) => {
    onTemplateUpdated?.({
      endpoint: resolvedEndpoint,
      template: { ...template, fields: fields.map(field => (field.name === event.fieldName ? event.field : field)) },
      event: 'updated-field',
    });
  };

  const handleDelete = (event: { templateId: string; fieldName: string }) => {
    setSelectedField(null);
    onTemplateUpdated?.({
      endpoint: resolvedEndpoint,
      template: { ...template, fields: fields.filter(field => field.name !== event.fieldName) },
      event: 'deleted-field',
    });
  };

  return (
    <div className="vdocs:relative vdocs:font-sans vdocs:min-h-[600px]">
      <div className="vdocs:flex vdocs:flex-col vdocs:items-center vdocs:box-border vdocs:min-h-[200px] vdocs:p-[15px] vdocs:gap-[15px]">
        {documents.map(document => (
          <div key={document.id} className="vdocs:w-full vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
            {documents.length > 1 && (
              <div className="vdocs:box-border vdocs:w-full vdocs:rounded-md vdocs:bg-ink vdocs:text-white vdocs:text-base vdocs:font-medium vdocs:px-5 vdocs:py-3">
                {document.name}
              </div>
            )}

            {Array.from({ length: document.pages || 0 }, (_, index) => index + 1).map(page => (
              <FieldsPage
                key={`${document.id}-${page}`}
                document={document}
                page={page}
                fields={fields.filter(field => field.document_id === document.id && field.page === page)}
                roles={sortedRoles}
                endpoint={resolvedEndpoint}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ))}

        {!documents.length && (
          <div className="vdocs:text-lg vdocs:text-muted vdocs:py-20">
            This template does not have any documents yet.
          </div>
        )}
      </div>

      {selectedField && (
        <Portal anchor={selectedField.anchor} onClickAway={() => setSelectedField(null)}>
          <TemplateFieldProperties
            templateId={templateId}
            fieldName={selectedField.name}
            endpoint={endpoint}
            onClose={() => setSelectedField(null)}
            onSettingsChanged={handleSettingsChanged}
            onDelete={handleDelete}
            onSdkError={onSdkError}
          />
        </Portal>
      )}
    </div>
  );
}
