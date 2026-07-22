import type { InputSignal } from '@angular/core';
import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';

/**
 * The shared contract for signing-field components, mirroring the React SDK's
 * FieldBaseProps. Fields are presentational: they render a field's current
 * state from inputs and report user actions through outputs. Data loading,
 * persistence, and dialog flows belong to the caller (eventually the sign
 * embed). Builder-only affordances (dragging, settings popovers, scaling) are
 * intentionally absent; see docs/PORTING.md.
 *
 * Angular components cannot spread a shared props object the way the React
 * fields do, so every field declares these five signal inputs itself and
 * implements this interface to keep the declarations aligned.
 */
export interface IFieldBaseInputs {
  /** The field to render. Template fields render defaults; envelope fields render live values. */
  readonly field: InputSignal<IEnvelopeField | ITemplateField>;
  /** Disable input regardless of the field's own readonly state (preview modes). */
  readonly disabled: InputSignal<boolean>;
  /** Render the display-final-value state (signing is complete for this field). */
  readonly done: InputSignal<boolean>;
  /** Draw the focused treatment and, where applicable, focus the inner input. */
  readonly focused: InputSignal<boolean>;
  /** Zero-based recipient index, used for the vdocs-signer-N background class. */
  readonly signerIndex: InputSignal<number>;
}

/** The signer-N white-label hook, mirroring the legacy signer classes. */
export const signerClassName = (signerIndex = 0): string => `vdocs-signer-${(signerIndex % 10) + 1}`;

/** Resolve the display value for a field, tolerating both field shapes. */
export const fieldValue = (field: IEnvelopeField | ITemplateField): string =>
  ('value' in field && field.value != null ? String(field.value) : '') || ('default' in field && field.default != null ? String(field.default) : '');

/**
 * Join the truthy entries of a class list. Fields compute their host classes
 * with this, standing in for the filter(Boolean).join(' ') arrays the React
 * fields build for their wrapper divs.
 */
export const composeClasses = (parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');
