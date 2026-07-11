import { useState } from 'react';
import { isValidEmail } from '@verdocs/js-sdk';
import type { IRole, TRecipientType, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useDeleteTemplateRole, useUpdateTemplateRole } from '../../hooks/useTemplateStructure';
import { useTemplate } from '../../hooks/useTemplates';
import SelectInput from '../../controls/SelectInput';
import TextInput from '../../controls/TextInput';
import Checkbox from '../../controls/Checkbox';
import HelpIcon from '../../controls/HelpIcon';
import Button from '../../controls/Button';
import { SDKError } from '../../types';

const TypeOptions = [
  { label: 'Signer', value: 'signer' },
  { label: 'CC', value: 'cc' },
  { label: 'Approver', value: 'approver' },
];

/** Pending form edits, layered over the role prop. An empty object means the form is clean. */
interface IRoleEdits {
  name?: string;
  type?: TRecipientType;
  sequence?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  delegator?: boolean;
}

export interface TemplateRolePropertiesProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The template ID the role belongs to. */
  templateId: string;
  /** The role to edit. */
  role: IRole;
  /** Called when the panel should close, after a save or when the user dismisses it. */
  onClose?: () => void;
  /**
   * Called when the user deletes the role. The role has already been deleted
   * server-side when this fires; the parent should update its UI to match.
   */
  onDelete?: (event: { templateId: string; roleName: string }) => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

/**
 * An editing panel for a single template role: its name, type, signing
 * sequence, default contact info, and delegation setting. Typically composed
 * by TemplateRoles, but it can be hosted anywhere a role and template ID are
 * in hand.
 */
export default function TemplateRoleProperties({ endpoint, templateId, role, onClose, onDelete, onSdkError }: TemplateRolePropertiesProps) {
  // Only needed to know whether fields reference this role; roles are renameable
  // until fields point at them by name.
  const { data: template } = useTemplate(templateId, endpoint);
  const updateRoleMutation = useUpdateTemplateRole(endpoint);
  const deleteRoleMutation = useDeleteTemplateRole(endpoint);

  const [edits, setEdits] = useState<IRoleEdits>({});
  const dirty = Object.keys(edits).length > 0;

  const hasFields = (template?.fields || []).some(field => field.role_name === role.name);

  const name = edits.name ?? role.name;
  const type = edits.type ?? role.type;
  const sequence = edits.sequence ?? role.sequence;
  const firstName = edits.first_name ?? role.first_name ?? '';
  const lastName = edits.last_name ?? role.last_name ?? '';
  const email = edits.email ?? role.email ?? '';
  const phone = edits.phone ?? role.phone ?? '';
  const delegator = edits.delegator ?? role.delegator ?? false;

  // Contact info is all-or-nothing: leave it blank to fill in at send time, or
  // supply a complete first/last/email set for a "known" role.
  const isValid = (!email && !firstName && !lastName) || (isValidEmail(email) && !!firstName && !!lastName);

  const setEdit = (edit: IRoleEdits) => setEdits(previous => ({ ...previous, ...edit }));

  const reportError = (error: Error) => {
    const err = error as Error & { response?: { status?: number; data?: unknown } };
    onSdkError?.(new SDKError(err.message, err.response?.status, err.response?.data));
  };

  const handleSave = () => {
    updateRoleMutation.mutate(
      {
        templateId,
        name: role.name,
        params: { name, type, sequence, first_name: firstName, last_name: lastName, email, phone, delegator },
      },
      {
        onSuccess: () => {
          setEdits({});
          onClose?.();
        },
        onError: reportError,
      },
    );
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you wish to remove this role? All associated fields will be removed as well. This action cannot be undone.')) {
      return;
    }

    deleteRoleMutation.mutate(
      { templateId, name: role.name },
      {
        onSuccess: () => {
          onDelete?.({ templateId, roleName: role.name });
          onClose?.();
        },
        onError: reportError,
      },
    );
  };

  return (
    <form
      autoComplete="off"
      onSubmit={e => e.preventDefault()}
      className="vdocs:box-border vdocs:flex vdocs:w-80 vdocs:flex-col vdocs:gap-[15px] vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:p-5 vdocs:font-sans vdocs:text-ink vdocs:shadow-lg">
      <div>
        <TextInput
          label="Role Name (Must be unique)"
          value={name}
          autoComplete="off"
          disabled={hasFields}
          placeholder="Role Name..."
          className="vdocs:mb-0"
          onChange={e => setEdit({ name: e.target.value })}
        />
        {hasFields && (
          <div className="vdocs:mt-[7px] vdocs:text-xs vdocs:italic">
            This role has fields assigned and can no longer be renamed.
          </div>
        )}
      </div>

      <SelectInput
        label="Type"
        value={type}
        options={TypeOptions}
        className="vdocs:mb-0"
        onChange={e => setEdit({ type: e.target.value as TRecipientType })}
      />

      <TextInput
        label="Sequence"
        type="number"
        min={1}
        value={String(sequence)}
        autoComplete="off"
        className="vdocs:mb-0"
        description="Roles sharing a sequence number act in parallel; higher numbers act later."
        onChange={e => setEdit({ sequence: Math.max(1, Math.floor(+e.target.value || 1)) })}
      />

      <div>
        <div className="vdocs:mb-1 vdocs:text-sm vdocs:font-bold vdocs:text-muted">
          Default Contact Info:
        </div>

        <div className="vdocs:flex vdocs:flex-row vdocs:gap-[15px]">
          <TextInput
            aria-label="First Name"
            value={firstName}
            autoComplete="off"
            placeholder="First..."
            className="vdocs:mb-0"
            onChange={e => setEdit({ first_name: e.target.value })}
          />

          <TextInput
            aria-label="Last Name"
            value={lastName}
            autoComplete="off"
            placeholder="Last..."
            className="vdocs:mb-0"
            onChange={e => setEdit({ last_name: e.target.value })}
          />
        </div>
      </div>

      <TextInput
        aria-label="Email Address"
        value={email}
        autoComplete="off"
        placeholder="Email Address..."
        className="vdocs:mb-0"
        onChange={e => setEdit({ email: e.target.value })}
      />

      <TextInput
        aria-label="Phone Number"
        value={phone}
        autoComplete="off"
        placeholder="Phone Number..."
        className="vdocs:mb-0"
        onChange={e => setEdit({ phone: e.target.value })}
      />

      <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
        <Checkbox label="May Delegate" checked={delegator} onChange={e => setEdit({ delegator: e.target.checked })} />
        <HelpIcon text="If enabled, this recipient may delegate their actions to another individual." />
      </div>

      <div className="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-between">
        <button
          type="button"
          aria-label="Delete Role"
          disabled={dirty || deleteRoleMutation.isPending}
          onClick={handleDelete}
          className="vdocs:flex vdocs:h-[34px] vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:px-1.5 vdocs:text-danger vdocs:active:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:text-disabled">
          <TrashIcon />
        </button>

        <Button
          size="small"
          label="Save"
          disabled={!dirty || !isValid || updateRoleMutation.isPending}
          onClick={handleSave}
        />
      </div>
    </form>
  );
}

// Ported from the legacy component's inline SVG; colored by the button's text color.
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className="vdocs:size-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
