import { useState } from 'react';
import { TextInput } from '@verdocs/react-sdk';
import { kindLabel, type StubField } from '../fields';

export interface PropertiesPanelProps {
  /** The selected field, or undefined when nothing is selected. */
  field?: StubField;
}

/**
 * The right-hand properties panel. The inputs are live so the panel feels
 * real, but nothing is saved anywhere: mount it with a key of the field id
 * so local edits reset when the selection changes.
 */
export default function PropertiesPanel({ field }: PropertiesPanelProps) {
  const [name, setName] = useState(field?.id ?? '');
  const [tooltip, setTooltip] = useState('');
  const [required, setRequired] = useState(true);

  if (!field) {
    return (
      <aside className="properties-panel">
        <h2 className="panel-title">
          Field properties
        </h2>
        <p className="panel-empty">
          Select a field on the page to edit its properties.
        </p>
      </aside>
    );
  }

  return (
    <aside className="properties-panel">
      <h2 className="panel-title">
        Field properties
      </h2>
      <span className="kind-badge">
        {kindLabel(field.kind)}
      </span>

      <TextInput label="Field name" value={name} onChange={event => setName(event.target.value)} />

      <div className="recipient-row">
        <span className="recipient-label">
          Recipient:
        </span>
        <span className={`recipient-pill r${field.recipient}`}>
          <i aria-hidden="true" />
          Signer
          {' '}
          {field.recipient}
        </span>
      </div>

      <label className="required-row">
        <input type="checkbox" checked={required} onChange={event => setRequired(event.target.checked)} />
        <span>
          Required
        </span>
      </label>

      <TextInput
        label="Tooltip"
        placeholder="Shown to the signer on hover"
        value={tooltip}
        onChange={event => setTooltip(event.target.value)}
      />

      <button type="button" className="danger-link">
        Delete field
      </button>
    </aside>
  );
}
