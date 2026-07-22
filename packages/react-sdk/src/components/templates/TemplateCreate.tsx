import { useState, type FormEvent } from 'react';
import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';
import { useCreateTemplate } from '../../hooks/useTemplates';
import FileChooser from '../../controls/FileChooser';
import TextInput from '../../controls/TextInput';
import Spinner from '../../controls/Spinner';
import Button from '../../controls/Button';
import { SDKError } from '../../types';

// Matches the legacy web-sdk limit: the API caps creation requests at 20MB, and
// the extra half-megabyte leaves room for the multipart framing around the files.
const DEFAULT_MAX_SIZE = 20.5 * 1024 * 1024;

export interface TemplateCreateProps {
  /** Endpoint override for dual-session scenarios. Defaults to the provider's endpoint. */
  endpoint?: VerdocsEndpoint;
  /** Maximum combined size of the uploaded documents, in bytes. Defaults to roughly 20MB. */
  maxSize?: number;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
  /** Called if an error occurs, with information about the error. */
  onSdkError?: (error: SDKError) => void;
  /** Called when the template has been created. */
  onTemplateCreated?: (template: ITemplate) => void;
}

/**
 * Upload one or more documents and create a new template from them. This is
 * typically the first step in a template creation workflow: when
 * onTemplateCreated fires, the host usually routes to its template editor.
 */
export default function TemplateCreate({ endpoint, maxSize = DEFAULT_MAX_SIZE, onCancel, onSdkError, onTemplateCreated }: TemplateCreateProps) {
  const createTemplate = useCreateTemplate(endpoint);
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);

  const totalSize = files.reduce((total, file) => total + file.size, 0);
  const sizeError = totalSize > maxSize ? 'Total file size must not exceed 20MB.' : '';
  const submitDisabled = !files.length || !name.trim() || !!sizeError || createTemplate.isPending;

  const handleSelectFiles = (selected: File[]) => {
    setFiles(selected);

    // A new selection suggests a template name, but never over a name the user typed.
    const first = selected[0];
    if (!nameEdited && first) {
      setName(first.name);
    }
  };

  const handleNameChange = (e: FormEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
    setNameEdited(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitDisabled) {
      return;
    }

    createTemplate.mutate(
      { name: name.trim(), documents: files },
      {
        onSuccess: template => onTemplateCreated?.(template),
        onError: error => {
          const err = error as Error & { response?: { status?: number; data?: unknown } };
          onSdkError?.(new SDKError(err.message, err.response?.status, err.response?.data));
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="vdocs:flex vdocs:flex-col vdocs:p-3 vdocs:bg-surface vdocs:font-sans">
      <TextInput
        required
        label="Name"
        value={name}
        placeholder="Template Name..."
        disabled={createTemplate.isPending}
        onChange={handleNameChange}
      />

      {/* FileChooser has no disabled prop, so we gate interaction at the wrapper while the upload runs. */}
      <div className={createTemplate.isPending ? 'vdocs:pointer-events-none vdocs:opacity-50' : ''}>
        <FileChooser multiple onSelectFiles={handleSelectFiles} />
      </div>

      {!!sizeError && (
        <div className="vdocs:mt-4 vdocs:text-sm vdocs:text-danger">
          {sizeError}
        </div>
      )}

      <div className="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2 vdocs:mt-4">
        {createTemplate.isPending && (
          <>
            <Spinner mode="dark" size={24} />
            <div className="vdocs:text-sm vdocs:text-muted">
              Creating template...
            </div>
          </>
        )}

        <div className="vdocs:flex-1" />

        <Button
          size="small"
          label="Cancel"
          variant="outline"
          disabled={createTemplate.isPending}
          onClick={() => onCancel?.()}
        />

        <Button size="small" type="submit" label="Create" disabled={submitDisabled} />
      </div>
    </form>
  );
}
