import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { IRole, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useDeleteTemplateField, useUpdateTemplateField } from '../../hooks/useTemplateStructure';
import { useTemplate } from '../../hooks/useTemplates';
import { HelpCircleIcon } from '../../controls/icons';
import SelectInput from '../../controls/SelectInput';
import TextInput from '../../controls/TextInput';
import Checkbox from '../../controls/Checkbox';
import { showToast } from '../../utils/toast';
import Button from '../../controls/Button';
import Loader from '../../controls/Loader';
import { SDKError } from '../../types';

export interface TemplateFieldPropertiesProps {
  /** The ID of the template the field belongs to. */
  templateId: string;
  /** The name of the field to edit. */
  fieldName: string;
  /** If set, the panel gets a help view toggled by an icon in its header. */
  helpText?: ReactNode;
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** Called when the user cancels the panel, and after a successful save or delete. */
  onClose?: () => void;
  /** Called after the field has been deleted server-side. */
  onDelete?: (event: { templateId: string; fieldName: string }) => void;
  /** Called after the field's settings have been saved, with the updated field. */
  onSettingsChanged?: (event: { fieldName: string; field: ITemplateField }) => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

const PANEL_CLASSES =
  'vdocs:box-border vdocs:w-80 vdocs:p-5 vdocs:rounded-ctl vdocs:bg-surface vdocs:border vdocs:border-solid '
  + 'vdocs:border-edge-light vdocs:shadow-[2px_2px_10px_0_rgba(0,0,0,0.12)] vdocs:font-sans vdocs:text-ink';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface IOptionRow {
  id: string;
  label: string;
}

const isFilledOption = (option: IOptionRow) => option.id.trim() !== '' || option.label.trim() !== '';

// The options grid always ends with one blank row so there is somewhere to type
// a new entry, mirroring the legacy cleanupOptions behavior.
const withBlankRow = (options: IOptionRow[]): IOptionRow[] => [...options.filter(isFilledOption), { id: '', label: '' }];

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className="vdocs:size-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

interface FieldSettingsFormProps {
  templateId: string;
  field: ITemplateField;
  roles: IRole[];
  helpText?: ReactNode;
  endpoint?: VerdocsEndpoint;
  onClose?: () => void;
  onDelete?: (event: { templateId: string; fieldName: string }) => void;
  onSettingsChanged?: (event: { fieldName: string; field: ITemplateField }) => void;
  onSdkError?: (error: SDKError) => void;
}

// The draft form. Split from the outer component so the draft state can seed
// itself from the loaded field once per open (the outer keys this by field
// name) instead of syncing props to state with effects.
function FieldSettingsForm({ templateId, field, roles, helpText, endpoint, onClose, onDelete, onSettingsChanged, onSdkError }: FieldSettingsFormProps) {
  const updateFieldMutation = useUpdateTemplateField(endpoint);
  const deleteFieldMutation = useDeleteTemplateField(endpoint);

  const [dirty, setDirty] = useState(false);
  const [showingHelp, setShowingHelp] = useState(false);
  const [name, setName] = useState(field.name);
  const [label, setLabel] = useState(field.label || '');
  const [roleName, setRoleName] = useState(field.role_name);
  const [required, setRequired] = useState(!!field.required);
  const [readOnly, setReadOnly] = useState(!!field.readonly);
  const [group, setGroup] = useState(field.group || '');
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [defaultValue, setDefaultValue] = useState(field.default || '');
  const [options, setOptions] = useState<IOptionRow[]>(() => withBlankRow(field.options || []));

  const title = `${capitalize(field.type.replace(/_/g, ' '))} Settings`;

  if (helpText && showingHelp) {
    return (
      <div className={PANEL_CLASSES}>
        <h6 className="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
          {title}
          <span className="vdocs:flex-1" />
          <button
            type="button"
            aria-label="Hide help"
            onClick={() => setShowingHelp(false)}
            className="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100">
            <HelpCircleIcon className="vdocs:size-6" />
          </button>
        </h6>

        <div className="vdocs:text-sm">
          {helpText}
        </div>
      </div>
    );
  }

  const reportError = (error: unknown) => {
    const e = error as { message: string; response?: { status?: number; data?: unknown } };
    onSdkError?.(new SDKError(e.message, e.response?.status, e.response?.data));
  };

  const isTextField = field.type === 'textbox' || field.type === 'textarea';
  const filledOptions = options.filter(isFilledOption);

  const saveDisabled =
    !dirty
    || updateFieldMutation.isPending
    || (field.type === 'dropdown' && !filledOptions.length)
    || (readOnly && !defaultValue);

  const handleSave = () => {
    updateFieldMutation.mutate(
      {
        templateId,
        name: field.name,
        params: {
          name,
          role_name: roleName,
          required,
          readonly: readOnly,
          label: label || null,
          group: group || null,
          placeholder: placeholder || null,
          default: defaultValue || null,
          options: filledOptions,
        },
      },
      {
        onSuccess: updated => {
          onSettingsChanged?.({ fieldName: field.name, field: updated });
          onClose?.();
        },
        onError: error => {
          showToast('Error updating field, please try again later', { style: 'error' });
          reportError(error);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteFieldMutation.mutate(
      { templateId, name: field.name },
      {
        onSuccess: () => {
          onDelete?.({ templateId, fieldName: field.name });
          onClose?.();
        },
        onError: error => {
          showToast('Error deleting field, please try again later', { style: 'error' });
          reportError(error);
        },
      },
    );
  };

  const handleCancel = () => {
    setDirty(false);
    setName(field.name);
    setLabel(field.label || '');
    setRoleName(field.role_name);
    setRequired(!!field.required);
    setReadOnly(!!field.readonly);
    setGroup(field.group || '');
    setPlaceholder(field.placeholder || '');
    setDefaultValue(field.default || '');
    setOptions(withBlankRow(field.options || []));
    onClose?.();
  };

  const handleOptionChange = (index: number, key: 'id' | 'label', value: string) => {
    setOptions(previous => withBlankRow(previous.map((option, i) => (i === index ? { ...option, [key]: value } : option))));
    setDirty(true);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(previous => withBlankRow(previous.filter((_option, i) => i !== index)));
    setDirty(true);
  };

  return (
    <div className={PANEL_CLASSES}>
      <h6 className="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
        {title}
        <span className="vdocs:flex-1" />
        {helpText && (
          <button
            type="button"
            aria-label="Show help"
            onClick={() => setShowingHelp(true)}
            className="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100">
            <HelpCircleIcon className="vdocs:size-6" />
          </button>
        )}
      </h6>

      <TextInput
        label="Field Name"
        value={name}
        autoComplete="off"
        placeholder="Field Name..."
        onChange={e => {
          setName(e.target.value);
          setDirty(true);
        }}
      />

      <TextInput
        label="Optional Label"
        value={label}
        autoComplete="off"
        placeholder="Optional Label..."
        onChange={e => {
          setLabel(e.target.value);
          setDirty(true);
        }}
      />

      <SelectInput
        label="Role"
        value={roleName}
        options={roles.map(role => ({ label: role.name, value: role.name }))}
        onChange={e => {
          setRoleName(e.target.value);
          setDirty(true);
        }}
      />

      {isTextField && (
        <TextInput
          label="Default Value"
          value={defaultValue}
          autoComplete="off"
          placeholder={readOnly && !defaultValue ? 'Default value required' : 'Pre-filled value...'}
          onChange={e => {
            setDefaultValue(e.target.value);
            setDirty(true);
          }}
        />
      )}

      {field.type === 'radio' && (
        <TextInput
          label="Group"
          value={group}
          autoComplete="off"
          placeholder="Group..."
          description="Enable exclusive selections. Only one option within the same group may be selected at a time."
          onChange={e => {
            // Group names are normalized the way the legacy editor did it, so
            // radio buttons grouped across sessions keep matching.
            setGroup((e.target.value || '')
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]/g, ''));
            setDirty(true);
          }}
        />
      )}

      {isTextField && (
        <TextInput
          label="Placeholder"
          value={placeholder}
          autoComplete="off"
          placeholder="Placeholder..."
          onChange={e => {
            setPlaceholder(e.target.value);
            setDirty(true);
          }}
        />
      )}

      <div className="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:my-2.5">
        <Checkbox
          label="Required"
          checked={required}
          onChange={e => {
            setRequired(e.target.checked);
            setDirty(true);
          }}
        />

        <Checkbox
          label="Read-only"
          checked={readOnly}
          onChange={e => {
            setReadOnly(e.target.checked);
            setDirty(true);
          }}
        />
      </div>

      {field.type === 'dropdown' && (
        <div className="vdocs:bg-canvas vdocs:rounded-ctl vdocs:p-2.5 vdocs:mt-2.5">
          <div className="vdocs:flex vdocs:gap-2 vdocs:mb-1 vdocs:text-sm vdocs:font-bold">
            <div className="vdocs:flex-1">
              ID
            </div>
            <div className="vdocs:flex-1">
              Label
            </div>
            <div className="vdocs:w-7" />
          </div>

          {options.map((option, index) => (
            <div key={index} className="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:mb-1">
              <TextInput
                aria-label={`Option ${index + 1} ID`}
                value={option.id}
                placeholder="Unique ID"
                className="vdocs:flex-1 vdocs:mb-0"
                onChange={e => handleOptionChange(index, 'id', e.target.value)}
              />
              <TextInput
                aria-label={`Option ${index + 1} label`}
                value={option.label}
                placeholder="Display label"
                className="vdocs:flex-1 vdocs:mb-0"
                onChange={e => handleOptionChange(index, 'label', e.target.value)}
              />
              <button
                type="button"
                aria-label={`Remove option ${index + 1}`}
                onClick={() => handleRemoveOption(index)}
                className="vdocs:flex vdocs:size-7 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-ink vdocs:cursor-pointer vdocs:hover:text-danger">
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:mt-[30px]">
        <button
          type="button"
          aria-label="Delete field"
          disabled={dirty || deleteFieldMutation.isPending}
          onClick={handleDelete}
          className="vdocs:flex vdocs:size-[34px] vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-danger vdocs:cursor-pointer vdocs:disabled:opacity-40 vdocs:disabled:cursor-default">
          <TrashIcon />
        </button>
        <div className="vdocs:flex-1" />
        <Button size="small" variant="outline" label="Cancel" disabled={!dirty} onClick={handleCancel} />
        <Button size="small" label="Save" disabled={saveDisabled} onClick={handleSave} />
      </div>
    </div>
  );
}

/**
 * An edit panel for one template field's settings: name, label, role, required
 * and read-only flags, plus per-type extras (default value and placeholder for
 * text fields, the exclusive-selection group for radio buttons, the options
 * grid for dropdowns). Saves through useUpdateTemplateField and deletes
 * through useDeleteTemplateField, so the template's detail cache refreshes
 * before onSettingsChanged or onDelete fire.
 *
 * The legacy component emitted a role name in its delete event, a leftover
 * from the role properties panel; the port reports the deleted field's name.
 */
export default function TemplateFieldProperties({
  templateId,
  fieldName,
  helpText,
  endpoint,
  onClose,
  onDelete,
  onSettingsChanged,
  onSdkError,
}: TemplateFieldPropertiesProps) {
  const query = useTemplate(templateId, endpoint);

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
      <div className={`${PANEL_CLASSES} vdocs:relative vdocs:min-h-40`}>
        <Loader />
      </div>
    );
  }

  const field = (query.data?.fields || []).find(f => f.name === fieldName);

  // This panel is a companion to larger experiences, so like the legacy
  // component it goes blank rather than erroring when the field is missing.
  if (!field) {
    return null;
  }

  return (
    <FieldSettingsForm
      key={fieldName}
      templateId={templateId}
      field={field}
      roles={query.data?.roles || []}
      helpText={helpText}
      endpoint={endpoint}
      onClose={onClose}
      onDelete={onDelete}
      onSettingsChanged={onSettingsChanged}
      onSdkError={onSdkError}
    />
  );
}
