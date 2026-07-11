import { useEffect, useRef, useState } from 'react';
import type { ITemplateCreateParams, TTemplateSender, TTemplateVisibility, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useTemplate, useUpdateTemplate } from '../../hooks/useTemplates';
import { useResolvedEndpoint } from '../../provider/VerdocsContext';
import { SDKError, type ITemplateEvent } from '../../types';
import ComponentError from '../../controls/ComponentError';
import SelectInput from '../../controls/SelectInput';
import TextInput from '../../controls/TextInput';
import { showToast } from '../../utils/toast';
import Button from '../../controls/Button';
import Switch from '../../controls/Switch';

// The server stores reminder delays in milliseconds; the form edits them in days.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const VisibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'public', label: 'Public' },
];

const SenderOptions = [
  { value: 'envelope_creator', label: 'Envelope Creator' },
  { value: 'template_owner', label: 'Template Owner' },
];

/**
 * Pending form edits, layered over the server copy of the template. An empty
 * object means the form is clean.
 */
interface ITemplateSettingsEdits {
  name?: string;
  visibility?: TTemplateVisibility;
  sender?: TTemplateSender;
  sendReminders?: boolean;
  initialReminderDays?: number;
  followupReminderDays?: number;
}

export interface TemplateSettingsProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** The template ID to edit. */
  templateId: string;
  /** Called after the settings are saved successfully, with the updated template. */
  onSettingsChanged?: (event: ITemplateEvent) => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
}

/**
 * Display an edit form for a template's basic settings: name, visibility,
 * envelope ownership, and signing reminders. Values load from the template
 * detail query and save through a single update call.
 */
export default function TemplateSettings({ endpoint, templateId, onSettingsChanged, onCancel, onSdkError }: TemplateSettingsProps) {
  const resolvedEndpoint = useResolvedEndpoint(endpoint);
  const query = useTemplate(templateId, endpoint);
  const updateTemplateMutation = useUpdateTemplate(endpoint);

  const [edits, setEdits] = useState<ITemplateSettingsEdits>({});
  const dirty = Object.keys(edits).length > 0;

  const onSdkErrorRef = useRef(onSdkError);
  onSdkErrorRef.current = onSdkError;

  useEffect(() => {
    if (query.error) {
      const error = query.error as { message: string; response?: { status?: number; data?: unknown } };
      onSdkErrorRef.current?.(new SDKError(error.message, error.response?.status, error.response?.data));
    }
  }, [query.error]);

  const template = query.data;

  if (query.error) {
    return <ComponentError message="Unable to load this template. Please try again later." />;
  }

  if (!template) {
    return (
      <div className="vdocs:max-w-[600px] vdocs:p-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="vdocs:h-10 vdocs:my-2.5 vdocs:rounded-ctl vdocs:bg-canvas vdocs:animate-pulse" />
        ))}
      </div>
    );
  }

  // The template is the source of truth; edits overlay it until they are saved
  // (the mutation primes the cache with the server's copy, so clearing the
  // edits after a save leaves the form showing exactly what was stored).
  const name = edits.name ?? template.name;
  const visibility = edits.visibility ?? template.visibility ?? 'private';
  const sender = edits.sender ?? template.sender;
  const sendReminders = edits.sendReminders ?? !!template.initial_reminder;
  const initialReminderDays = edits.initialReminderDays ?? (template.initial_reminder ? Math.floor(template.initial_reminder / MS_PER_DAY) : 0);
  const followupReminderDays = edits.followupReminderDays ?? (template.followup_reminders ? Math.floor(template.followup_reminders / MS_PER_DAY) : 0);

  const setEdit = (edit: ITemplateSettingsEdits) => setEdits(previous => ({ ...previous, ...edit }));

  const handleSave = () => {
    // The create/update params type declares the reminder fields as numbers, but
    // the API uses null to disable reminders (and the legacy component sent null),
    // so we cast to keep the wire payload identical.
    const params = {
      name,
      visibility,
      sender,
      initial_reminder: sendReminders ? initialReminderDays * MS_PER_DAY : null,
      followup_reminders: sendReminders ? followupReminderDays * MS_PER_DAY : null,
    } as Partial<ITemplateCreateParams>;

    updateTemplateMutation.mutate(
      { templateId, params },
      {
        onSuccess: updated => {
          setEdits({});
          onSettingsChanged?.({ endpoint: resolvedEndpoint, template: updated });
        },
        onError: error => {
          const err = error as Error & { response?: { status?: number; data?: { error?: string } } };
          onSdkError?.(new SDKError(err.message, err.response?.status, err.response?.data));
          showToast(err.response?.data?.error || 'Error updating template, please try again later.', { style: 'error' });
        },
      },
    );
  };

  return (
    <form
      autoComplete="off"
      onSubmit={e => e.preventDefault()}
      className="vdocs:flex vdocs:flex-col vdocs:max-w-[600px] vdocs:p-3 vdocs:bg-canvas vdocs:font-sans vdocs:text-ink">
      <h5 className="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">
        Settings
      </h5>

      <div className="vdocs:mt-5">
        <TextInput
          label="Template Name"
          value={name}
          autoComplete="off"
          placeholder="Template Name..."
          onChange={e => setEdit({ name: e.target.value })}
        />
      </div>

      <div className="vdocs:mt-5">
        <SelectInput
          label="Visibility"
          value={visibility}
          options={VisibilityOptions}
          onChange={e => setEdit({ visibility: e.target.value as TTemplateVisibility })}
        />
      </div>

      <div className="vdocs:mt-5">
        <SelectInput
          label="Owner for envelopes created from this template"
          value={sender}
          options={SenderOptions}
          onChange={e => setEdit({ sender: e.target.value as TTemplateSender })}
        />
      </div>

      <div className="vdocs:mt-5">
        <Switch
          label="Send Reminders"
          checked={sendReminders}
          onCheckedChange={checked => setEdit({ sendReminders: checked })}
        />
      </div>

      {sendReminders && (
        <div className="vdocs:mt-5">
          <TextInput
            label="First Reminder (days)"
            type="number"
            min={0}
            value={String(initialReminderDays)}
            autoComplete="off"
            placeholder="Delay in days..."
            onChange={e => setEdit({ initialReminderDays: Math.max(0, Math.floor(+e.target.value || 0)) })}
          />
        </div>
      )}

      {sendReminders && (
        <div className="vdocs:mt-5">
          <TextInput
            label="Follow-up Reminders (days)"
            type="number"
            min={0}
            value={String(followupReminderDays)}
            autoComplete="off"
            placeholder="Delay in days..."
            onChange={e => setEdit({ followupReminderDays: Math.max(0, Math.floor(+e.target.value || 0)) })}
          />
        </div>
      )}

      <div className="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
        <Button variant="outline" label="Cancel" size="small" onClick={() => onCancel?.()} />
        <Button label="Save" size="small" disabled={!dirty || updateTemplateMutation.isPending} onClick={handleSave} />
      </div>
    </form>
  );
}
