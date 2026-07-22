import { SIGNER_FIELDS, type SignerField } from '../fields';

export interface SignerPageProps {
  /** Completed values keyed by field id. Absent means not yet filled. */
  values: Record<string, string>;
  /** The field the flag is pointing at, or undefined when all are done. */
  activeId?: string;
  /** Called when the user clicks a field (or its flag). */
  onFieldClick: (field: SignerField) => void;
}

interface FieldSlotProps {
  field: SignerField;
  value?: string;
  active: boolean;
  onClick: (field: SignerField) => void;
}

// One field box plus, when it is the next field to complete, the floating
// flag that points at it. Empty boxes tint from the primary token; the
// active one rings with the accent so the signer's eye lands on it.
function FieldSlot({ field, value, active, onClick }: FieldSlotProps) {
  const script = field.kind === 'signature' || field.kind === 'initials';

  return (
    <div className="field-slot">
      {active && (
        <button type="button" className="sign-flag" onClick={() => onClick(field)}>
          {field.kind === 'signature' ? 'Sign' : 'Next'}
        </button>
      )}
      <button
        type="button"
        className={`signer-field kind-${field.kind}${active ? ' active' : ''}${value ? ' filled' : ''}`}
        onClick={() => onClick(field)}>
        {!value && field.label}
        {value && field.kind === 'checkbox' && (
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        )}
        {value && field.kind !== 'checkbox' && (
          <span className={script ? 'value-script' : 'value-plain'}>
            {value}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * The fake document being signed. The paper and its text keep fixed,
 * unthemed styling on purpose: a real PDF would not change with the
 * customer's brand, only the chrome and the field boxes do.
 */
export default function SignerPage({ values, activeId, onFieldClick }: SignerPageProps) {
  const slot = (id: string) => {
    const field = SIGNER_FIELDS.find(candidate => candidate.id === id);
    if (!field) {
      throw new Error(`Unknown stub field: ${id}`);
    }
    return (
      <FieldSlot field={field} value={values[field.id]} active={field.id === activeId} onClick={onFieldClick} />
    );
  };

  return (
    <div className="doc-page">
      <h1 className="doc-title">
        SERVICE AGREEMENT
      </h1>
      <p className="doc-para">
        This Service Agreement (the &quot;Agreement&quot;) sets out the terms under which the
        provider will deliver the services described in Schedule A, and is effective as
        of the date of last signature below.
      </p>
      <p className="doc-para">
        1. Services. The provider will perform the services with reasonable skill and
        care, in accordance with the timeline and acceptance criteria in Schedule A.
      </p>
      <p className="doc-para">
        2. Fees. The client will pay the fees listed in Schedule B within thirty days of
        each invoice date.
      </p>

      <div className="signing-block">
        <div className="signing-row">
          <span className="signing-label">
            Full name
          </span>
          {slot('full-name')}
        </div>
        <div className="signing-row">
          <span className="signing-label">
            Title
          </span>
          {slot('title')}
        </div>
        <div className="signing-row">
          <span className="signing-label">
            I have read and agree to the terms of this Agreement
          </span>
          {slot('agree')}
        </div>
        <div className="signing-row">
          <span className="signing-label">
            Signature
          </span>
          {slot('signature')}
        </div>
        <div className="signing-row">
          <span className="signing-label">
            Initials
          </span>
          {slot('initials')}
        </div>
        <div className="signing-row">
          <span className="signing-label">
            Date signed
          </span>
          {slot('date')}
        </div>
      </div>
    </div>
  );
}
