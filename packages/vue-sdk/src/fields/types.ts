import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';

/**
 * The shared contract for signing-field components. Fields are presentational:
 * they render a field's current state from props and report user input through
 * emits (the React SDK's onXxx callbacks become camelCase events here, e.g.
 * onFieldChange is fieldChange). Data loading, persistence, and dialog flows
 * belong to the caller (eventually the sign embed). Builder-only affordances
 * (dragging, settings popovers, scaling) are intentionally absent; see
 * docs/PORTING.md. The React contract also spreads host attributes onto the
 * wrapper div; Vue's attribute fallthrough covers that with no extra props.
 */
export interface FieldBaseProps {
  /** The field to render. Template fields render defaults; envelope fields render live values. */
  field: IEnvelopeField | ITemplateField;
  /** Disable input regardless of the field's own readonly state (preview modes). */
  disabled?: boolean;
  /** Render the display-final-value state (signing is complete for this field). */
  done?: boolean;
  /** Draw the focused treatment and, where applicable, focus the inner input. */
  focused?: boolean;
  /** Zero-based recipient index, used for the vdocs-signer-N background class. */
  signerIndex?: number;
}

/** The signer-N white-label hook, mirroring the legacy signer classes. */
export const signerClassName = (signerIndex = 0): string => `vdocs-signer-${(signerIndex % 10) + 1}`;

/** Resolve the display value for a field, tolerating both field shapes. */
export const fieldValue = (field: IEnvelopeField | ITemplateField): string =>
  ('value' in field && field.value != null ? String(field.value) : '') || ('default' in field && field.default != null ? String(field.default) : '');
