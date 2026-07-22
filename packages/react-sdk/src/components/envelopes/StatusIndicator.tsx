import type { ComponentProps } from 'react';
import type { IEnvelope, TEnvelopeStatus, TRecipientStatus } from '@verdocs/js-sdk';

/**
 * The statuses the indicator can display. Envelope and recipient statuses are
 * shown directly; 'accepted' is reserved for a planned recipient state, and
 * 'some-signed' is derived (an envelope where some but not all recipients have
 * submitted) rather than stored, so it cannot be passed via the status prop.
 */
export type TIndicatorStatus = TEnvelopeStatus | TRecipientStatus | 'accepted' | 'some-signed';

export interface StatusIndicatorProps extends ComponentProps<'div'> {
  /** The status to display. Takes precedence over `envelope` if both are set. */
  status?: TEnvelopeStatus | TRecipientStatus | 'accepted';
  /** The envelope to display status for. Ignored if `status` is set directly. */
  envelope?: IEnvelope;
  /** Light suits light backgrounds (colored icons and dark text), dark inverts. */
  theme?: 'light' | 'dark';
  /** The small variant suits densely populated views such as table rows. */
  size?: 'small' | 'normal';
}

// Icon colors ported from the legacy web-sdk artwork. Values with a matching
// design token go through CSS vars (with the legacy value as fallback) so
// white-label overrides still apply; the rest have no token and stay literal.
const ACCENT = 'var(--vdocs-color-accent, #654dcb)';
const WHITE = 'var(--vdocs-color-white, #ffffff)';

interface StatusIconProps {
  color: string;
  className?: string;
}

function AcceptedIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="12.5" cy="12.5" r="11.5" stroke={color} strokeWidth="2" />
      <path d="M11.728 15.968C11.7067 15.9893 11.7013 16.0107 11.712 16.032C11.7227 16.0533 11.744 16.064 11.776 16.064H16.112C16.1653 16.064 16.208 16.0853 16.24 16.128C16.2827 16.16 16.304 16.2027 16.304 16.256V17.808C16.304 17.8613 16.2827 17.9093 16.24 17.952C16.208 17.984 16.1653 18 16.112 18H8.912C8.85867 18 8.81067 17.984 8.768 17.952C8.736 17.9093 8.72 17.8613 8.72 17.808V16.336C8.72 16.24 8.752 16.16 8.816 16.096C9.33867 15.584 9.872 15.0293 10.416 14.432C10.96 13.824 11.3013 13.4453 11.44 13.296C11.7387 12.944 12.0427 12.608 12.352 12.288C13.3227 11.2107 13.808 10.4107 13.808 9.888C13.808 9.51467 13.6747 9.21067 13.408 8.976C13.1413 8.73067 12.7947 8.608 12.368 8.608C11.9413 8.608 11.5947 8.73067 11.328 8.976C11.0613 9.21067 10.928 9.52533 10.928 9.92V10.32C10.928 10.3733 10.9067 10.4213 10.864 10.464C10.832 10.496 10.7893 10.512 10.736 10.512H8.848C8.79467 10.512 8.74667 10.496 8.704 10.464C8.672 10.4213 8.656 10.3733 8.656 10.32V9.568C8.688 8.992 8.86933 8.48533 9.2 8.048C9.53067 7.6 9.968 7.25867 10.512 7.024C11.0667 6.78933 11.6853 6.672 12.368 6.672C13.1253 6.672 13.7813 6.816 14.336 7.104C14.9013 7.38133 15.3333 7.76 15.632 8.24C15.9413 8.72 16.096 9.25333 16.096 9.84C16.096 10.288 15.984 10.7467 15.76 11.216C15.536 11.6853 15.2 12.192 14.752 12.736C14.4213 13.152 14.064 13.5627 13.68 13.968C13.296 14.3733 12.7253 14.96 11.968 15.728L11.728 15.968Z" fill={color} />
    </svg>
  );
}

function CanceledIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 24C15.1826 24 18.2348 22.7357 20.4853 20.4853C22.7357 18.2348 24 15.1826 24 12C24 8.8174 22.7357 5.76516 20.4853 3.51472C18.2348 1.26428 15.1826 0 12 0C8.8174 0 5.76516 1.26428 3.51472 3.51472C1.26428 5.76516 0 8.8174 0 12C0 15.1826 1.26428 18.2348 3.51472 20.4853C5.76516 22.7357 8.8174 24 12 24V24ZM9 7.5C8.60218 7.5 8.22064 7.65804 7.93934 7.93934C7.65804 8.22064 7.5 8.60218 7.5 9V15C7.5 15.3978 7.65804 15.7794 7.93934 16.0607C8.22064 16.342 8.60218 16.5 9 16.5H15C15.3978 16.5 15.7794 16.342 16.0607 16.0607C16.342 15.7794 16.5 15.3978 16.5 15V9C16.5 8.60218 16.342 8.22064 16.0607 7.93934C15.7794 7.65804 15.3978 7.5 15 7.5H9Z" fill={color} />
    </svg>
  );
}

function CompletedIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.7152 2.35464C7.71225 2.27504 8.65876 1.88287 9.41995 1.23399C10.2797 0.501758 11.3721 0.0996094 12.5013 0.0996094C13.6306 0.0996094 14.723 0.501758 15.5827 1.23399C16.3439 1.88287 17.2904 2.27504 18.2875 2.35464C19.4135 2.44463 20.4706 2.93273 21.2693 3.73145C22.068 4.53017 22.5561 5.58727 22.6461 6.71324C22.7251 7.70989 23.1173 8.65694 23.7667 9.41799C24.499 10.2777 24.9011 11.3701 24.9011 12.4994C24.9011 13.6287 24.499 14.7211 23.7667 15.5808C23.1179 16.342 22.7257 17.2885 22.6461 18.2855C22.5561 19.4115 22.068 20.4686 21.2693 21.2673C20.4706 22.0661 19.4135 22.5542 18.2875 22.6441C17.2904 22.7237 16.3439 23.1159 15.5827 23.7648C14.723 24.497 13.6306 24.8992 12.5013 24.8992C11.3721 24.8992 10.2797 24.497 9.41995 23.7648C8.65876 23.1159 7.71225 22.7237 6.7152 22.6441C5.58923 22.5542 4.53213 22.0661 3.73341 21.2673C2.93469 20.4686 2.44658 19.4115 2.35659 18.2855C2.27699 17.2885 1.88482 16.342 1.23595 15.5808C0.503711 14.7211 0.101562 13.6287 0.101562 12.4994C0.101562 11.3701 0.503711 10.2777 1.23595 9.41799C1.88482 8.65681 2.27699 7.71029 2.35659 6.71324C2.44658 5.58727 2.93469 4.53017 3.73341 3.73145C4.53213 2.93273 5.58923 2.44463 6.7152 2.35464V2.35464ZM18.2472 10.4952C18.5295 10.2029 18.6858 9.81138 18.6822 9.40497C18.6787 8.99857 18.5157 8.60981 18.2283 8.32242C17.9409 8.03504 17.5522 7.87203 17.1458 7.8685C16.7394 7.86497 16.3478 8.0212 16.0555 8.30354L10.9513 13.4077L8.9472 11.4035C8.65486 11.1212 8.26333 10.965 7.85692 10.9685C7.45052 10.972 7.06176 11.135 6.77438 11.4224C6.48699 11.7098 6.32398 12.0986 6.32045 12.505C6.31692 12.9114 6.47315 13.3029 6.7555 13.5952L9.8555 16.6952C10.1462 16.9858 10.5403 17.1491 10.9513 17.1491C11.3624 17.1491 11.7565 16.9858 12.0472 16.6952L18.2472 10.4952V10.4952Z" fill={color} />
    </svg>
  );
}

function DeclinedIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M24 12C24 15.1826 22.7357 18.2348 20.4853 20.4853C18.2348 22.7357 15.1826 24 12 24C8.8174 24 5.76516 22.7357 3.51472 20.4853C1.26428 18.2348 0 15.1826 0 12C0 8.8174 1.26428 5.76516 3.51472 3.51472C5.76516 1.26428 8.8174 0 12 0C15.1826 0 18.2348 1.26428 20.4853 3.51472C22.7357 5.76516 24 8.8174 24 12V12ZM13.5 18C13.5 18.3978 13.342 18.7794 13.0607 19.0607C12.7794 19.342 12.3978 19.5 12 19.5C11.6022 19.5 11.2206 19.342 10.9393 19.0607C10.658 18.7794 10.5 18.3978 10.5 18C10.5 17.6022 10.658 17.2206 10.9393 16.9393C11.2206 16.658 11.6022 16.5 12 16.5C12.3978 16.5 12.7794 16.658 13.0607 16.9393C13.342 17.2206 13.5 17.6022 13.5 18V18ZM12 4.5C11.6022 4.5 11.2206 4.65804 10.9393 4.93934C10.658 5.22064 10.5 5.60218 10.5 6V12C10.5 12.3978 10.658 12.7794 10.9393 13.0607C11.2206 13.342 11.6022 13.5 12 13.5C12.3978 13.5 12.7794 13.342 13.0607 13.0607C13.342 12.7794 13.5 12.3978 13.5 12V6C13.5 5.60218 13.342 5.22064 13.0607 4.93934C12.7794 4.65804 12.3978 4.5 12 4.5Z" fill={color} />
    </svg>
  );
}

function InProgressIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M14.7917 9.625L18.6667 13.5M18.6667 13.5L14.7917 17.375M18.6667 13.5H8.33333M25.125 13.5C25.125 15.0266 24.8243 16.5383 24.2401 17.9487C23.6559 19.3591 22.7996 20.6406 21.7201 21.7201C20.6406 22.7996 19.3591 23.6559 17.9487 24.2401C16.5383 24.8243 15.0266 25.125 13.5 25.125C11.9734 25.125 10.4617 24.8243 9.0513 24.2401C7.64089 23.6559 6.35936 22.7996 5.27988 21.7201C4.2004 20.6406 3.34411 19.3591 2.7599 17.9487C2.17569 16.5383 1.875 15.0266 1.875 13.5C1.875 10.4169 3.09977 7.45999 5.27988 5.27988C7.45999 3.09977 10.4169 1.875 13.5 1.875C16.5831 1.875 19.54 3.09977 21.7201 5.27988C23.9002 7.45999 25.125 10.4169 25.125 13.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenedIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="12.5" cy="12.5" r="11.5" stroke={color} strokeWidth="2" />
      <path d="M11.4 6.848C11.4533 6.816 11.5333 6.8 11.64 6.8H13.576C13.6293 6.8 13.672 6.82133 13.704 6.864C13.7467 6.896 13.768 6.93867 13.768 6.992V17.808C13.768 17.8613 13.7467 17.9093 13.704 17.952C13.672 17.984 13.6293 18 13.576 18H11.704C11.6507 18 11.6027 17.984 11.56 17.952C11.528 17.9093 11.512 17.8613 11.512 17.808V9.04C11.512 9.01867 11.5013 8.99733 11.48 8.976C11.4587 8.95467 11.4373 8.94933 11.416 8.96L9.832 9.392L9.768 9.408C9.672 9.408 9.624 9.34933 9.624 9.232L9.576 7.856C9.576 7.74933 9.624 7.67467 9.72 7.632L11.4 6.848Z" fill={color} />
    </svg>
  );
}

function PendingIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M7.33333 12H7.345M12 12H12.0117M16.6667 12H16.6783M22.5 12C22.5 13.3789 22.2284 14.7443 21.7007 16.0182C21.1731 17.2921 20.3996 18.4496 19.4246 19.4246C18.4496 20.3996 17.2921 21.1731 16.0182 21.7007C14.7443 22.2284 13.3789 22.5 12 22.5C10.6211 22.5 9.25574 22.2284 7.98182 21.7007C6.70791 21.1731 5.55039 20.3996 4.57538 19.4246C3.60036 18.4496 2.82694 17.2921 2.29926 16.0182C1.77159 14.7443 1.5 13.3789 1.5 12C1.5 9.21523 2.60625 6.54451 4.57538 4.57538C6.54451 2.60625 9.21523 1.5 12 1.5C14.7848 1.5 17.4555 2.60625 19.4246 4.57538C21.3938 6.54451 22.5 9.21523 22.5 12Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignedIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="12.5" cy="12.5" r="11.5" stroke={color} strokeWidth="2" />
      <path d="M15.632 12.656C15.8453 13.1467 15.952 13.712 15.952 14.352C15.952 14.928 15.856 15.4613 15.664 15.952C15.408 16.6347 14.976 17.168 14.368 17.552C13.7707 17.936 13.0613 18.128 12.24 18.128C11.4293 18.128 10.7147 17.9253 10.096 17.52C9.488 17.1147 9.05067 16.5653 8.784 15.872C8.63467 15.456 8.54933 15.008 8.528 14.528C8.528 14.4 8.592 14.336 8.72 14.336H10.608C10.736 14.336 10.8 14.4 10.8 14.528C10.8427 14.88 10.9013 15.1413 10.976 15.312C11.072 15.5893 11.2267 15.808 11.44 15.968C11.664 16.1173 11.9253 16.192 12.224 16.192C12.8213 16.192 13.232 15.9307 13.456 15.408C13.6053 15.088 13.68 14.7147 13.68 14.288C13.68 13.7867 13.6 13.376 13.44 13.056C13.1947 12.5547 12.784 12.304 12.208 12.304C12.0907 12.304 11.968 12.3413 11.84 12.416C11.712 12.48 11.5573 12.576 11.376 12.704C11.3333 12.736 11.2907 12.752 11.248 12.752C11.184 12.752 11.136 12.72 11.104 12.656L10.16 11.328C10.1387 11.296 10.128 11.2587 10.128 11.216C10.128 11.152 10.1493 11.0987 10.192 11.056L12.736 8.832C12.7573 8.81067 12.7627 8.78933 12.752 8.768C12.752 8.74667 12.736 8.736 12.704 8.736H8.944C8.89067 8.736 8.84267 8.72 8.8 8.688C8.768 8.64533 8.752 8.59733 8.752 8.544V6.992C8.752 6.93867 8.768 6.896 8.8 6.864C8.84267 6.82133 8.89067 6.8 8.944 6.8H15.616C15.6693 6.8 15.712 6.82133 15.744 6.864C15.7867 6.896 15.808 6.93867 15.808 6.992V8.752C15.808 8.83733 15.7707 8.91733 15.696 8.992L13.6 10.912C13.5787 10.9333 13.568 10.9547 13.568 10.976C13.5787 10.9973 13.6053 11.008 13.648 11.008C14.576 11.1893 15.2373 11.7387 15.632 12.656Z" fill={color} />
    </svg>
  );
}

function SomeSignedIcon({ color, className }: StatusIconProps) {
  return (
    <svg viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M9.62395 13.5009L12.2073 16.0842L17.374 10.9176M8.11916 4.06786C9.04568 3.99392 9.92527 3.6296 10.6327 3.02678C11.4322 2.34513 12.4484 1.9707 13.499 1.9707C14.5495 1.9707 15.5657 2.34513 16.3652 3.02678C17.0726 3.6296 17.9522 3.99392 18.8787 4.06786C19.926 4.15118 20.9092 4.60497 21.6521 5.34781C22.3949 6.09064 22.8487 7.07389 22.932 8.12111C23.0059 9.04764 23.3703 9.92723 23.9731 10.6347C24.6547 11.4341 25.0292 12.4503 25.0292 13.5009C25.0292 14.5515 24.6547 15.5677 23.9731 16.3671C23.3703 17.0746 23.0059 17.9542 22.932 18.8807C22.8487 19.9279 22.3949 20.9112 21.6521 21.654C20.9092 22.3968 19.926 22.8506 18.8787 22.9339C17.9522 23.0079 17.0726 23.3722 16.3652 23.975C15.5657 24.6567 14.5495 25.0311 13.499 25.0311C12.4484 25.0311 11.4322 24.6567 10.6327 23.975C9.92527 23.3722 9.04568 23.0079 8.11916 22.9339C7.07194 22.8506 6.08869 22.3968 5.34585 21.654C4.60302 20.9112 4.14923 19.9279 4.06591 18.8807C3.99196 17.9542 3.62765 17.0746 3.02483 16.3671C2.34318 15.5677 1.96875 14.5515 1.96875 13.5009C1.96875 12.4503 2.34318 11.4341 3.02483 10.6347C3.62765 9.92723 3.99196 9.04764 4.06591 8.12111C4.14923 7.07389 4.60302 6.09064 5.34585 5.34781C6.08869 4.60497 7.07194 4.15118 8.11916 4.06786V4.06786Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface IStatusDisplay {
  Icon: (props: StatusIconProps) => React.JSX.Element;
  light: string;
  dark: string;
}

const PendingDisplay: IStatusDisplay = { Icon: PendingIcon, light: '#999999', dark: '#cccccc' };

// The icon artwork and per-theme colors for each status, ported 1:1 from the
// legacy web-sdk indicator. Submitted shares the completed artwork, and
// invited shares in-progress, exactly as the legacy component mapped them.
const StatusIcons: Record<string, IStatusDisplay> = {
  accepted: { Icon: AcceptedIcon, light: ACCENT, dark: WHITE },
  canceled: { Icon: CanceledIcon, light: '#9095b3', dark: '#9095b3' },
  complete: { Icon: CompletedIcon, light: '#50be80', dark: '#63c58e' },
  declined: { Icon: DeclinedIcon, light: '#ff0000', dark: '#f95353' },
  'in progress': { Icon: InProgressIcon, light: ACCENT, dark: WHITE },
  invited: { Icon: InProgressIcon, light: ACCENT, dark: WHITE },
  opened: { Icon: OpenedIcon, light: ACCENT, dark: WHITE },
  pending: PendingDisplay,
  signed: { Icon: SignedIcon, light: ACCENT, dark: WHITE },
  'some-signed': { Icon: SomeSignedIcon, light: ACCENT, dark: '#63c58e' },
  submitted: { Icon: CompletedIcon, light: '#50be80', dark: '#63c58e' },
};

const StatusMessages: Record<string, string> = {
  accepted: 'Accepted',
  canceled: 'Cancelled',
  complete: 'Completed',
  declined: 'Declined',
  'in progress': 'In Progress',
  invited: 'Invited',
  opened: 'Opened',
  pending: 'Pending',
  signed: 'Signed',
  'some-signed': 'Partly Signed',
  submitted: 'Submitted',
};

/**
 * The display label for an envelope or recipient status. Unknown statuses are
 * returned unchanged.
 */
export const getStatusMessage = (status: string) => StatusMessages[status] ?? status;

/**
 * The theme color associated with an envelope or recipient status, used by
 * envelope views that color recipient names, workflow lines, and similar
 * accents by status.
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'invited':
    case 'opened':
    case 'accepted':
    case 'signed':
      return 'var(--vdocs-color-accent, #654dcb)';
    case 'some-signed':
    case 'submitted':
    case 'complete':
      return 'var(--vdocs-color-primary, #55bc81)';
    case 'declined':
      return '#ff0000';
    default:
      return '#999999';
  }
};

/**
 * Display an icon and message describing an envelope or recipient's completion
 * status. The status may be passed directly, or a whole envelope may be passed
 * to display its overall status.
 */
export default function StatusIndicator({ status, envelope, theme = 'light', size = 'normal', className = '', ...rest }: StatusIndicatorProps) {
  let resolvedStatus: string = status || envelope?.status || 'pending';

  // Envelopes where some but not all recipients have submitted show a derived
  // "partly signed" state that is never stored as an envelope status.
  if (!status && envelope?.recipients) {
    const submittedRecipients = envelope.recipients.filter(r => r.status === 'submitted');
    if (submittedRecipients.length > 0 && submittedRecipients.length !== envelope.recipients.length) {
      resolvedStatus = 'some-signed';
    }
  }

  const { Icon, light, dark } = StatusIcons[resolvedStatus] ?? PendingDisplay;

  return (
    <div
      className={`vdocs:flex vdocs:flex-row vdocs:flex-nowrap vdocs:items-center vdocs:rounded-md vdocs:font-sans ${
        size === 'small' ? 'vdocs:text-base' : 'vdocs:text-lg'
      } ${theme === 'dark' ? 'vdocs:text-white' : 'vdocs:text-ink'} ${className}`}
      {...rest}>
      <Icon
        color={theme === 'dark' ? dark : light}
        className={size === 'small' ? 'vdocs:size-5 vdocs:mr-2 vdocs:shrink-0' : 'vdocs:size-[25px] vdocs:mr-2.5 vdocs:shrink-0'}
      />
      <span className="vdocs:whitespace-nowrap">
        {getStatusMessage(resolvedStatus)}
      </span>
    </div>
  );
}
