import { useState } from 'react';
import type { IOrganization } from '@verdocs/js-sdk';
import QuestionDialog from '../../dialogs/QuestionDialog';

export interface SignFooterProps {
  /**
   * The envelope's organization, used for white-label branding: the powered-by
   * label/link and the terms-of-use and privacy-policy links.
   */
  organization?: Partial<IOrganization> | null;
  /** Once the recipient is done signing, the action buttons are hidden and only branding remains. */
  isDone?: boolean;
  /** Called with the entered text when the user asks the sender a question. The caller delivers it. */
  onAskQuestion?: (question: string) => void;
  /** Called when the user declines to sign. */
  onDecline?: () => void;
  /** Called when the user wants to save their progress and finish later. */
  onFinishLater?: () => void;
}

function QuestionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.4809 13.8423H15.4C16.2962 13.8423 17 13.1288 17 12.2764V5.56582C17 4.71348 16.2962 4 15.4 4H4.6C3.70383 4 3 4.71348 3 5.56582V12.2764C3 13.1288 3.70383 13.8423 4.6 13.8423H6.19908L6.2 17L6.20346 16.9997L6.20502 16.9988L10.4809 13.8423ZM6.79895 17.8034C6.35668 18.1298 5.73 18.0406 5.39921 17.6042C5.26989 17.4335 5.2 17.2262 5.2 17.0133L5.19937 14.8423H4.6C3.16406 14.8423 2 13.6935 2 12.2764V5.56582C2 4.14876 3.16406 3 4.6 3H15.4C16.8359 3 18 4.14876 18 5.56582V12.2764C18 13.6935 16.8359 14.8423 15.4 14.8423H10.81L6.79895 17.8034Z" />
    </svg>
  );
}

function DeclineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.14645 7.14645C7.34171 6.95118 7.65829 6.95118 7.85355 7.14645L10 9.29289L12.1464 7.14645C12.3417 6.95118 12.6583 6.95118 12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L10.7071 10L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L10 10.7071L7.85355 12.8536C7.65829 13.0488 7.34171 13.0488 7.14645 12.8536C6.95118 12.6583 6.95118 12.3417 7.14645 12.1464L9.29289 10L7.14645 7.85355C6.95118 7.65829 6.95118 7.34171 7.14645 7.14645ZM3 6C3 4.34315 4.34315 3 6 3H14C15.6569 3 17 4.34315 17 6V14C17 15.6569 15.6569 17 14 17H6C4.34315 17 3 15.6569 3 14V6ZM6 4C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H14C15.1046 16 16 15.1046 16 14V6C16 4.89543 15.1046 4 14 4H6Z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5C3 3.89543 3.89543 3 5 3H13.3787C13.9091 3 14.4178 3.21071 14.7929 3.58579L16.4142 5.20711C16.7893 5.58218 17 6.09089 17 6.62132V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5ZM5 4C4.44772 4 4 4.44772 4 5V15C4 15.5523 4.44772 16 5 16L5 11.5C5 10.6716 5.67157 10 6.5 10H13.5C14.3284 10 15 10.6716 15 11.5V16C15.5523 16 16 15.5523 16 15V6.62132C16 6.3561 15.8946 6.10175 15.7071 5.91421L14.0858 4.29289C13.8983 4.10536 13.6439 4 13.3787 4L13 4V6.5C13 7.32843 12.3284 8 11.5 8L7.5 8C6.67157 8 6 7.32843 6 6.5L6 4H5ZM7 4L7 6.5C7 6.77614 7.22386 7 7.5 7L11.5 7C11.7761 7 12 6.77614 12 6.5V4L7 4ZM14 16V11.5C14 11.2239 13.7761 11 13.5 11H6.5C6.22386 11 6 11.2239 6 11.5V16H14Z" />
    </svg>
  );
}

const BUTTON_CLASSES =
  'vdocs:flex vdocs:cursor-pointer vdocs:flex-row vdocs:items-center vdocs:gap-1 vdocs:border-none vdocs:bg-transparent '
  + 'vdocs:p-0 vdocs:font-sans vdocs:text-xs vdocs:text-muted vdocs:outline-none';

const LINK_CLASSES = 'vdocs:cursor-pointer vdocs:border-0 vdocs:border-b vdocs:border-dotted vdocs:border-muted vdocs:text-muted vdocs:no-underline';

/**
 * A fixed footer toolbar for signing experiences, typically presented below the
 * document being signed. Offers the recipient convenience actions (ask the sender
 * a question, decline, finish later) and displays the sending organization's
 * white-label branding.
 */
export default function SignFooter({ organization = null, isDone = false, onAskQuestion, onDecline, onFinishLater }: SignFooterProps) {
  const [askingQuestion, setAskingQuestion] = useState(false);

  const hasButtons = !isDone;
  const justButtons = !organization?.powered_by_label && !organization?.terms_use_url && !organization?.privacy_policy_url;

  return (
    <div
      className="vdocs:fixed vdocs:inset-x-0 vdocs:bottom-0 vdocs:box-border vdocs:flex vdocs:h-12 vdocs:flex-row vdocs:items-center vdocs:justify-between vdocs:gap-2 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:px-6 vdocs:font-sans vdocs:text-xs vdocs:text-muted">
      {organization?.powered_by_label && (
        <div className={`vdocs:whitespace-nowrap ${hasButtons ? 'vdocs:max-[720px]:hidden' : 'vdocs:max-[540px]:hidden'}`}>
          {organization.powered_by_url ? (
            <a href={organization.powered_by_url} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
              {organization.powered_by_label}
            </a>
          ) : (
            <span>
              {organization.powered_by_label}
            </span>
          )}
        </div>
      )}

      {hasButtons && (
        <div
          className={`vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-4 vdocs:whitespace-nowrap ${
            justButtons ? 'vdocs:flex-1 vdocs:justify-center' : 'vdocs:max-[540px]:flex-1 vdocs:max-[540px]:justify-center'
          }`}>
          <button type="button" className={BUTTON_CLASSES} onClick={() => setAskingQuestion(true)}>
            <QuestionIcon />
            Ask Sender a Question
          </button>
          <button type="button" className={BUTTON_CLASSES} onClick={() => onDecline?.()}>
            <DeclineIcon />
            Decline Signing
          </button>
          <button type="button" className={BUTTON_CLASSES} onClick={() => onFinishLater?.()}>
            <SaveIcon />
            Finish Later
          </button>
        </div>
      )}

      {/* Rendered even when empty so justify-between keeps the buttons centered, matching the legacy layout. */}
      <div className={`vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:whitespace-nowrap ${hasButtons ? 'vdocs:max-[540px]:hidden' : ''}`}>
        {organization?.terms_use_url && (
          <a href={organization.terms_use_url} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
            Terms of Use
          </a>
        )}
        {organization?.privacy_policy_url && (
          <a href={organization.privacy_policy_url} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
            Privacy Policy
          </a>
        )}
      </div>

      {askingQuestion && (
        <QuestionDialog
          onSubmit={question => {
            setAskingQuestion(false);
            onAskQuestion?.(question);
          }}
          onCancel={() => setAskingQuestion(false)}
        />
      )}
    </div>
  );
}
