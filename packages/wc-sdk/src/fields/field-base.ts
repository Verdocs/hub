import type { IEnvelopeField, ITemplateField } from '@verdocs/js-sdk';

/**
 * The shared contract for signing-field elements, mirroring the React SDK's
 * FieldBaseProps (react-sdk/src/fields/types.ts). Fields are presentational:
 * they render a field's current state from properties and report user input
 * through public events. Data loading, persistence, and dialog flows belong
 * to the host (eventually the sign embed). Builder-only affordances
 * (dragging, settings popovers, scaling) are intentionally absent; see
 * docs/PORTING.md.
 *
 * Every field element declares these reactive properties:
 *
 * - `field` (property-only): the field to render. Template fields render
 *   defaults; envelope fields render live values.
 * - `disabled`: disable input regardless of the field's own readonly state
 *   (preview modes).
 * - `done`: render the display-final-value state (signing is complete for
 *   this field).
 * - `focused`: draw the focused treatment and, where applicable, move
 *   keyboard focus onto the inner input.
 * - `signerIndex` (attribute `signer-index`): zero-based recipient index,
 *   used for the vdocs-signer-N background class.
 *
 * React callbacks map to events one for one: onFieldChange is
 * vdocs-field-change, onBeginSigning is vdocs-begin-signing, onSelectFile is
 * vdocs-select-file, onDeleteFile is vdocs-delete-file, and onBeginPayment
 * is vdocs-begin-payment.
 */
export interface IFieldBaseProperties {
  field?: IEnvelopeField | ITemplateField;
  disabled: boolean;
  done: boolean;
  focused: boolean;
  signerIndex: number;
}

/**
 * Detail payload for vdocs-field-change, mirroring the argument React passes
 * to onFieldChange: the checkbox field reports its new checked state as a
 * boolean, the radio field reports the selected option id (its field name),
 * and the other input fields report their new string value.
 */
export interface IFieldChangeDetail {
  value: string | boolean;
}

/** The signer-N white-label hook, mirroring the legacy signer classes. */
export const signerClassName = (signerIndex = 0): string => `vdocs-signer-${(signerIndex % 10) + 1}`;

/** Resolve the display value for a field, tolerating both field shapes. */
export const fieldValue = (field: IEnvelopeField | ITemplateField): string =>
  ('value' in field && field.value != null ? String(field.value) : '') || ('default' in field && field.default != null ? String(field.default) : '');

// Classes the sync helper applied last render, so the next pass can drop just
// its own stale entries.
const appliedClasses = new WeakMap<Element, string[]>();

/**
 * Reconcile a field's host class list. The host element plays the part of the
 * React fields' wrapper div, but consumers may also put their own classes on
 * the tag (the className passthrough there), so we only ever remove classes
 * we added ourselves.
 */
export const syncFieldClasses = (host: Element, parts: Array<string | false | null | undefined>): void => {
  const next = parts.filter((part): part is string => !!part).join(' ').split(' ').filter(Boolean);
  const previous = appliedClasses.get(host) ?? [];
  for (const name of previous) {
    if (!next.includes(name)) {
      host.classList.remove(name);
    }
  }
  if (next.length) {
    host.classList.add(...next);
  }
  appliedClasses.set(host, next);
};

declare global {
  interface GlobalEventHandlersEventMap {
    // Declared once here rather than in each field module: six fields fire
    // vdocs-field-change and two fire vdocs-begin-signing, and duplicate map
    // entries only merge cleanly when they stay literally identical.
    'vdocs-field-change': CustomEvent<IFieldChangeDetail>;
    'vdocs-begin-signing': CustomEvent<undefined>;
  }
}
