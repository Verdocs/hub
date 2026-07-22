const PALETTE_FIELDS = [
  'Signature',
  'Initials',
  'Textbox',
  'Checkbox',
  'Date',
  'Dropdown',
  'Radio group',
  'Attachment',
];

/**
 * The left-hand palette of field types. The chips only look draggable; the
 * stub has no drag behavior, it just needs to read as the real builder.
 */
export default function FieldsPalette() {
  return (
    <aside className="fields-palette">
      <h2 className="panel-title">
        Fields
      </h2>
      <ul className="palette-list">
        {PALETTE_FIELDS.map(field => (
          <li key={field}>
            <div className="palette-chip">
              <span className="palette-grip" aria-hidden="true" />
              {field}
            </div>
          </li>
        ))}
      </ul>
      <p className="palette-hint">
        Drag a field onto the page to place it.
      </p>
    </aside>
  );
}
