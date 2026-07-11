import type { HTMLAttributes, ReactNode } from 'react';
import { isFieldFilled, type IEnvelopeField } from '@verdocs/js-sdk';
import CircleCheckIcon from '../controls/icons/CircleCheckIcon';
import Button from '../controls/Button';

/** Which stage of the signing flow the card reflects. */
export type TSigningProgressMode = 'start' | 'signing' | 'completed';

const FIELD_TYPE_LABELS: Record<string, string> = {
  signature: 'Signature',
  initial: 'Initials',
  date: 'Date',
  textbox: 'Text Field',
  checkbox: 'Checkbox',
  radio: 'Radio Button',
  dropdown: 'Dropdown',
  attachment: 'Attachment',
  payment: 'Payment',
};

function fieldLabel(field?: IEnvelopeField) {
  if (!field) {
    return '';
  }

  const typeName = FIELD_TYPE_LABELS[field.type] || 'Field';
  return field.required ? `Required ${typeName}*` : `Optional ${typeName}`;
}

const CARD_CLASSES =
  'vdocs:box-border vdocs:flex vdocs:w-60 vdocs:flex-col vdocs:gap-3 vdocs:rounded-lg vdocs:bg-surface vdocs:p-4 vdocs:shadow-lg vdocs:font-sans';

function Separator() {
  return <div className="vdocs:h-px vdocs:w-full vdocs:bg-edge-light" />;
}

export interface SigningProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** The stage to render: the pre-signing prompt, in-flight progress, or the ready-to-submit card. */
  mode?: TSigningProgressMode;
  /** The fillable fields for the current recipient, in signing order. */
  fields?: IEnvelopeField[];
  /** Every field for the recipient, including auto-filled ones. Grouped radio checks need the full set; defaults to fields. */
  recipientFields?: IEnvelopeField[];
  /** The name of the currently focused field, used to show its label and position. */
  focusedField?: string;
  /** Fired when the user clicks Start Signing. */
  onStart?: () => void;
  /** Fired when the user clicks Next. */
  onNext?: () => void;
  /** Fired when the user clicks Previous. */
  onPrevious?: () => void;
  /** Fired when the user clicks Submit. */
  onSubmit?: () => void;
}

/**
 * The floating progress card shown alongside the signing experience: remaining
 * field counts, the focused field's label, and the flow controls (Start
 * Signing, Previous/Next, Submit). Progress is derived entirely from the field
 * props; the card keeps no state and runs no timers, so the caller advances the
 * flow in response to the callbacks.
 */
export default function SigningProgress({
  mode = 'start',
  fields = [],
  recipientFields = fields,
  focusedField = '',
  onStart,
  onNext,
  onPrevious,
  onSubmit,
  className = '',
  ...rest
}: SigningProgressProps) {
  // The legacy card pins itself above the document viewer and disappears on
  // small screens; callers can override the placement through className.
  const wrapperClasses = `vdocs:fixed vdocs:top-16 vdocs:left-5 vdocs:z-[900] vdocs:max-[600px]:hidden ${className}`;

  if (mode === 'completed') {
    return (
      <div className={wrapperClasses} {...rest}>
        <div className={CARD_CLASSES}>
          <div className="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-sm vdocs:font-medium vdocs:text-ink">
            <CircleCheckIcon className="vdocs:size-6 vdocs:shrink-0 vdocs:text-success" />
            Ready to Submit
          </div>
          <div className="vdocs:text-xs vdocs:leading-4 vdocs:text-muted">
            You have entered all requested signatures. Select Submit to complete the signing process.
          </div>
          <Separator />
          <Button label="Submit" size="small" className="vdocs:w-full" onClick={onSubmit} />
        </div>
      </div>
    );
  }

  // js-sdk counts a grouped radio as filled when any member of its group is
  // selected. The legacy card layered stricter own-value checks on top for
  // dropdowns, radios, and checkboxes, and we keep its exact predicate.
  const isFilled = (field: IEnvelopeField) =>
    isFieldFilled(field, recipientFields) &&
    (field.type !== 'dropdown' || !!field.value) &&
    (field.type !== 'radio' || field.value === 'true') &&
    (field.type !== 'checkbox' || field.value === 'true');

  const requiredFields = fields.filter(field => field.required);
  const requiredRemaining = requiredFields.filter(field => !isFilled(field)).length;
  const optionalFields = fields.filter(field => !field.required);
  const optionalRemaining = optionalFields.filter(field => !isFilled(field)).length;

  const focusedFieldObj = fields.find(field => field.name === focusedField);
  const currentIndex = Math.max(1, fields.findIndex(field => field.name === focusedField) + 1);
  const readyToSubmit = requiredRemaining === 0;
  const focusedDone = focusedFieldObj ? isFilled(focusedFieldObj) : false;

  let body: ReactNode;
  if (mode !== 'start' && focusedDone && readyToSubmit) {
    body = (
      <div className="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:text-xs vdocs:leading-4 vdocs:text-ink">
        <CircleCheckIcon className="vdocs:size-6 vdocs:shrink-0 vdocs:text-success" />
        Ready to submit.
      </div>
    );
  } else {
    body = <div className="vdocs:text-xs vdocs:leading-4 vdocs:text-ink">{fieldLabel(focusedFieldObj)}</div>;
  }

  let footer: ReactNode;
  if (mode === 'start') {
    footer = <Button label="Start Signing" size="small" className="vdocs:w-full" onClick={onStart} />;
  } else if (readyToSubmit) {
    footer = <Button label="Submit" size="small" className="vdocs:w-full" onClick={onSubmit} />;
  } else {
    footer = (
      <div className="vdocs:flex vdocs:w-full vdocs:gap-3">
        <Button label="Previous" size="small" variant="outline" className="vdocs:flex-1" disabled={currentIndex <= 1} onClick={onPrevious} />
        <Button label="Next" size="small" className="vdocs:flex-1" disabled={currentIndex >= fields.length} onClick={onNext} />
      </div>
    );
  }

  return (
    <div className={wrapperClasses} {...rest}>
      <div className={CARD_CLASSES}>
        <div className="vdocs:flex vdocs:flex-col vdocs:gap-1.5 vdocs:text-sm vdocs:text-ink">
          <div>
            {requiredRemaining} of {requiredFields.length} required fields remaining
          </div>
          {optionalFields.length > 0 && (
            <div className="vdocs:text-muted">
              {optionalRemaining} of {optionalFields.length} optional fields remaining
            </div>
          )}
        </div>

        {body}
        <Separator />
        {footer}
      </div>
    </div>
  );
}
