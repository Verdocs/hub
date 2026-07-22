import type { IEnvelopeDocument } from '@verdocs/js-sdk';

/**
 * Shared payload types and event declarations for the dialog elements. Each
 * detail shape mirrors the arguments the React SDK passes to the matching
 * callback (docs/PORTING.md: the React port defines the contract), reshaped
 * into a single object where a callback took positional arguments.
 */

/**
 * The image the user adopted, carried by vdocs-adopted. The initials variant
 * reuses this shape, with fullName carrying the entered initials.
 */
export interface IAdoptedSignature {
  /** Which mode produced the image. */
  type: 'typed' | 'drawn';
  /** The name (or initials) as entered when the image was adopted. */
  fullName: string;
  /** PNG data URL of the adopted image, on a transparent background. */
  dataUrl: string;
}

/** The delegation details collected by the delegate dialog, carried by its vdocs-delegate. */
export interface IDelegateDetails {
  /** The new recipient's first name. */
  first_name: string;
  /** The new recipient's last name. */
  last_name: string;
  /** The new recipient's email address. The signing invite goes here. */
  email: string;
  /** Optional phone number for SMS invites. */
  phone: string;
  /** Optional message to include in the invite. */
  message: string;
}

/** The signer's personal details from the KBA identity form, carried by vdocs-submit-identity. */
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

/** One answered KBA challenge question. React's onAnswerQuestion(questionType, choice) arguments, as an event payload. */
export interface IKbaAnswer {
  /** The type field of the question that was answered. */
  questionType: string;
  /** The choice the signer selected. */
  choice: string;
}

/**
 * The download flavors the user can choose: a single attachment as-is, the
 * signing certificate, everything merged into one PDF, or a ZIP of all files.
 */
export type TDownloadVariant = 'document' | 'certificate' | 'combined' | 'zip';

/** The user's download pick. React's onDownload(document, variant) arguments, as an event payload. */
export interface IDownloadSelection {
  /** The source document. Envelope-level picks with no single source document (zip, or a certificate not yet in documents) leave this undefined. */
  document: IEnvelopeDocument | undefined;
  /** Which download flavor was chosen. */
  variant: TDownloadVariant;
}

/** The text the user submitted, carried by vdocs-submit from the OTP, passcode, and question dialogs. */
export interface IDialogSubmitDetail {
  /** The entered code (OTP and passcode dialogs) or question text (question dialog). */
  value: string;
}

declare global {
  interface GlobalEventHandlersEventMap {
    // Declared once here rather than in each dialog module: most of these
    // events are fired by several dialogs, and duplicate map entries only
    // merge cleanly when they stay literally identical. The base dialog's
    // vdocs-close is not repeated here for the same reason: it is declared
    // by vdocs-menu-panel in controls.
    'vdocs-ok': CustomEvent<undefined>;
    'vdocs-cancel': CustomEvent<undefined>;
    // The OTP, passcode, and question dialogs carry the entered text; the
    // signing progress card fires it bare when the user submits the envelope.
    'vdocs-submit': CustomEvent<IDialogSubmitDetail | undefined>;
    'vdocs-resend': CustomEvent<undefined>;
    'vdocs-upload': CustomEvent<{ files: File[] }>;
    // The delegate dialog carries the collected details; the disclosure dialog
    // fires it bare, as the signer's request to open that delegation flow.
    'vdocs-delegate': CustomEvent<IDelegateDetails | undefined>;
    'vdocs-agree': CustomEvent<undefined>;
    'vdocs-decline': CustomEvent<undefined>;
    'vdocs-download': CustomEvent<IDownloadSelection>;
    'vdocs-adopted': CustomEvent<IAdoptedSignature>;
    'vdocs-answer-question': CustomEvent<IKbaAnswer>;
    'vdocs-submit-identity': CustomEvent<IKbaIdentityDetails>;
    'vdocs-start': CustomEvent<undefined>;
    'vdocs-next': CustomEvent<undefined>;
    'vdocs-previous': CustomEvent<undefined>;
  }
}
