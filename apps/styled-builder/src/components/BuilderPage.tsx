import { BUILDER_FIELDS, type StubField } from '../fields';

export interface BuilderPageProps {
  /** The id of the currently selected field. */
  selectedId: string;
  /** Called when the user clicks a placed field. */
  onSelectField: (id: string) => void;
}

interface PlacedFieldProps {
  field: StubField;
  selected: boolean;
  onSelect: (id: string) => void;
}

// The tint classes mirror how the real builder colors fields per recipient:
// recipient 1 tints from the primary token, recipient 2 from the accent.
function PlacedField({ field, selected, onSelect }: PlacedFieldProps) {
  return (
    <button
      type="button"
      className={`placed-field kind-${field.kind} r${field.recipient}${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(field.id)}>
      {field.kind !== 'checkbox' && field.label}
      {selected && (
        <>
          <span className="handle tl" aria-hidden="true" />
          <span className="handle tr" aria-hidden="true" />
          <span className="handle bl" aria-hidden="true" />
          <span className="handle br" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

/**
 * The fake document page. The paper and its text keep fixed, unthemed
 * styling on purpose: a real uploaded PDF would not change with the
 * customer's brand, only the chrome and the placed fields do.
 */
export default function BuilderPage({ selectedId, onSelectField }: BuilderPageProps) {
  const field = (id: string) => {
    const found = BUILDER_FIELDS.find(candidate => candidate.id === id);
    if (!found) {
      throw new Error(`Unknown stub field: ${id}`);
    }
    return (
      <PlacedField field={found} selected={found.id === selectedId} onSelect={onSelectField} />
    );
  };

  return (
    <div className="doc-page">
      <h1 className="doc-title">
        MUTUAL NON-DISCLOSURE AGREEMENT
      </h1>
      <p className="doc-para">
        This Mutual Non-Disclosure Agreement (the &quot;Agreement&quot;) is entered into by and
        between the parties identified below to protect information exchanged while
        evaluating a potential business relationship.
      </p>
      <p className="doc-para">
        1. Confidential Information. Each party may disclose business, technical, or
        financial information that is designated confidential, or that reasonably should
        be understood to be confidential given the nature of the information and the
        circumstances of disclosure.
      </p>
      <p className="doc-para">
        2. Term. The obligations in this Agreement remain in effect for three years from
        the date of last signature below.
      </p>

      <div className="doc-agree">
        {field('agree')}
        <span>
          Both parties agree to the terms above.
        </span>
      </div>

      <div className="sig-grid">
        <section>
          <h2 className="sig-party">
            Disclosing party
          </h2>
          <div className="field-row">
            {field('signature-1')}
          </div>
          <div className="field-row">
            {field('full-name-1')}
          </div>
          <div className="field-row">
            {field('date-1')}
          </div>
        </section>
        <section>
          <h2 className="sig-party">
            Receiving party
          </h2>
          <div className="field-row">
            {field('signature-2')}
          </div>
          <div className="field-row">
            {field('initials-2')}
          </div>
          <div className="field-row">
            {field('date-2')}
          </div>
        </section>
      </div>
    </div>
  );
}
