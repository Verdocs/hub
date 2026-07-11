import type { HTMLAttributes } from 'react';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';

/**
 * The shared contract for signing-field components. Fields are presentational:
 * they render a field's current state from props and report user input through
 * callbacks. Data loading, persistence, and dialog flows belong to the caller
 * (eventually the sign embed). Builder-only affordances (dragging, settings
 * popovers, scaling) are intentionally absent; see docs/PORTING.md.
 */
export interface FieldBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
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
