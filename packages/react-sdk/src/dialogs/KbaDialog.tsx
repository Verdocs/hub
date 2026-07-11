import { useState } from 'react';
import type { IKBAQuestion } from '@verdocs/js-sdk';
import { HelpCircleIcon } from '../controls/icons';
import SelectInput from '../controls/SelectInput';
import DateInput from '../controls/DateInput';
import TextInput from '../controls/TextInput';
import Checkbox from '../controls/Checkbox';
import Button from '../controls/Button';
import Dialog from './Dialog';

// The KBA identity provider only covers US states and territories, so the list is fixed.
// The leading blank entry keeps the select controlled before the signer picks one.
const STATE_OPTIONS = [
  { value: '', label: '' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District Of Columbia' },
  { value: 'FM', label: 'Federated States Of Micronesia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'GU', label: 'Guam' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PW', label: 'Palau' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VI', label: 'Virgin Islands' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export interface IKbaIdentityDetails {
  /** The signer's first name. */
  first_name: string;
  /** The signer's last name. */
  last_name: string;
  /** Street address. Two-line addresses combine into a single string. */
  address: string;
  /** City. Optional for identity checks. */
  city: string;
  /** Two-letter state or territory code. Optional for identity checks. */
  state: string;
  /** Zip code. */
  zip: string;
  /** Last 4 digits of the signer's Social Security Number. */
  ssn_last_4: string;
  /** Date of birth as an ISO yyyy-mm-dd string. */
  dob: string;
}

export interface KbaDialogProps {
  /** Which challenge to present: the identity details form, or the multiple-choice questions. */
  mode: 'identity' | 'questions';
  /** Heading for the help box shown above each question in questions mode. */
  helpTitle?: string;
  /** The questions to step through in questions mode, in the shape the KBA endpoints return. */
  questions?: IKBAQuestion[];
  /** Prefills the identity form, typically from the recipient record. */
  initialDetails?: Partial<IKbaIdentityDetails>;
  /** Fired in identity mode when the signer submits the completed form. The sign embed wires this to the KBA identity endpoint. */
  onSubmitIdentity?: (details: IKbaIdentityDetails) => void;
  /** Fired in questions mode as each question is answered, the last included. The sign embed accumulates these into the KBA challenge response. */
  onAnswerQuestion?: (questionType: string, choice: string) => void;
  /** Fired when the signer cancels via the Cancel button, the close control, or the overlay. */
  onCancel?: () => void;
}

/**
 * The knowledge-based authentication challenge dialog. Two modes cover the KBA steps a
 * signing session can be on: 'identity' collects the signer's personal details, and
 * 'questions' steps through the multiple-choice challenge questions the identity provider
 * returned, one at a time with a step counter. Purely presentational: the sign embed
 * fetches the KBA step, supplies the questions, and wires onSubmitIdentity and
 * onAnswerQuestion back to the KBA endpoints.
 */
export default function KbaDialog({ mode, helpTitle, questions = [], initialDetails, onSubmitIdentity, onAnswerQuestion, onCancel }: KbaDialogProps) {
  const [details, setDetails] = useState<IKbaIdentityDetails>(() => ({
    first_name: initialDetails?.first_name || '',
    last_name: initialDetails?.last_name || '',
    address: initialDetails?.address || '',
    city: initialDetails?.city || '',
    state: initialDetails?.state || '',
    zip: initialDetails?.zip || '',
    ssn_last_4: initialDetails?.ssn_last_4 || '',
    dob: initialDetails?.dob || '',
  }));
  const [agreed, setAgreed] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState('');

  const handleFieldChange = (field: keyof IKbaIdentityDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const heading = (
    <>
      Please Confirm Your Identity
      {mode === 'questions' && questions.length > 1 && (
        <span className="vdocs:ml-1.5 vdocs:text-muted">
          {`(${questionIndex + 1}/${questions.length})`}
        </span>
      )}
    </>
  );

  if (mode === 'questions') {
    const question = questions[questionIndex];
    const isLastQuestion = questionIndex >= questions.length - 1;

    const handleAnswer = () => {
      if (!question || !choice) {
        return;
      }

      onAnswerQuestion?.(question.type, choice);
      setChoice('');
      if (!isLastQuestion) {
        setQuestionIndex(questionIndex + 1);
      }
    };

    return (
      <Dialog
        heading={heading}
        onClose={onCancel}
        footer={(
          <div className="vdocs:flex vdocs:justify-end vdocs:gap-4">
            <Button label="Cancel" variant="outline" onClick={() => onCancel?.()} />
            <Button label={isLastQuestion ? 'Submit' : 'Next'} disabled={!choice} onClick={handleAnswer} />
          </div>
        )}>
        {(helpTitle || question) && (
          <div className="vdocs:flex vdocs:items-center vdocs:gap-4 vdocs:bg-accent-light vdocs:p-3.5 vdocs:text-white">
            <HelpCircleIcon className="vdocs:size-10 vdocs:shrink-0" />
            <div className="vdocs:text-sm">
              {helpTitle && (
                <div className="vdocs:font-semibold vdocs:mb-1">
                  {helpTitle}
                </div>
              )}
              {question && <div>{question.prompt}</div>}
            </div>
          </div>
        )}

        <div className="vdocs:my-4 vdocs:grid vdocs:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] vdocs:gap-4">
          {(question?.answer || []).map(option => (
            <button
              key={option}
              type="button"
              aria-pressed={choice === option}
              onClick={() => setChoice(option)}
              className={`vdocs:flex vdocs:h-15 vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-accent-light vdocs:px-1 vdocs:font-sans vdocs:text-sm vdocs:text-center ${
                choice === option ? 'vdocs:bg-accent-light vdocs:text-white' : 'vdocs:bg-transparent vdocs:text-muted'
              }`}>
              {option}
            </button>
          ))}
        </div>
      </Dialog>
    );
  }

  const canSubmitIdentity
    = agreed
      && !!details.first_name
      && !!details.last_name
      && !!details.address
      && !!details.zip
      && !!details.ssn_last_4
      && !!details.dob;

  // The identity provider needs an adult signer, so DOB entry keeps the legacy bounds of
  // 1920 through 18 years ago.
  const dobMax = new Date();
  dobMax.setFullYear(dobMax.getFullYear() - 18);

  return (
    <Dialog
      heading={heading}
      onClose={onCancel}
      footer={(
        <div className="vdocs:flex vdocs:justify-end">
          <Button label="Submit" disabled={!canSubmitIdentity} onClick={() => onSubmitIdentity?.(details)} />
        </div>
      )}>
      <div className="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
        Your Name:
        <span className="vdocs:text-danger">*</span>
      </div>
      <div className="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
        <TextInput
          aria-label="First name"
          placeholder="First name..."
          value={details.first_name}
          onChange={e => handleFieldChange('first_name', e.target.value)}
        />
        <TextInput
          aria-label="Last name"
          placeholder="Last name..."
          value={details.last_name}
          onChange={e => handleFieldChange('last_name', e.target.value)}
        />
      </div>

      <TextInput
        label="Address"
        required
        placeholder="Address..."
        value={details.address}
        onChange={e => handleFieldChange('address', e.target.value)}
      />

      <div className="vdocs:grid vdocs:grid-cols-3 vdocs:gap-x-4">
        <TextInput label="City" placeholder="City..." value={details.city} onChange={e => handleFieldChange('city', e.target.value)} />
        <SelectInput label="State" options={STATE_OPTIONS} value={details.state} onChange={e => handleFieldChange('state', e.target.value)} />
        <TextInput
          label="Zip Code"
          required
          placeholder="Zip Code..."
          value={details.zip}
          onChange={e => handleFieldChange('zip', e.target.value)}
        />
      </div>

      <div className="vdocs:grid vdocs:grid-cols-2 vdocs:gap-x-4">
        <TextInput
          label="SSN Last 4"
          required
          placeholder="Last 4 digits of your Social Security Number..."
          value={details.ssn_last_4}
          onChange={e => handleFieldChange('ssn_last_4', e.target.value)}
        />
        <DateInput
          label="Date of Birth"
          required
          min="1920-01-01"
          max={dobMax.toISOString().slice(0, 10)}
          value={details.dob}
          onChange={e => handleFieldChange('dob', e.target.value)}
        />
      </div>

      <Checkbox
        label="I agree to provide my personal information in order to validate my identity."
        checked={agreed}
        onChange={e => setAgreed(e.target.checked)}
        className="vdocs:my-2 vdocs:italic"
      />
    </Dialog>
  );
}
