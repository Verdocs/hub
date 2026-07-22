import { render, screen } from '@testing-library/react';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import StatusIndicator, { getStatusColor, getStatusMessage } from './StatusIndicator';

const makeEnvelope = (overrides: Partial<IEnvelope>): IEnvelope =>
  ({
    id: 'envelope-1',
    name: 'Test Envelope',
    status: 'pending',
    recipients: [],
    ...overrides,
  }) as IEnvelope;

const makeRecipient = (overrides: Partial<IRecipient>): IRecipient =>
  ({
    envelope_id: 'envelope-1',
    role_name: 'Signer 1',
    first_name: 'Test',
    last_name: 'Recipient',
    email: 'test@example.com',
    sequence: 1,
    status: 'invited',
    ...overrides,
  }) as IRecipient;

describe('StatusIndicator', () => {
  it.each([
    ['pending', 'Pending'],
    ['in progress', 'In Progress'],
    ['complete', 'Completed'],
    ['declined', 'Declined'],
    ['canceled', 'Cancelled'],
    ['invited', 'Invited'],
    ['opened', 'Opened'],
    ['signed', 'Signed'],
    ['submitted', 'Submitted'],
    ['accepted', 'Accepted'],
  ] as const)('renders the %s status as %s', (status, label) => {
    render(<StatusIndicator status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders an unknown status string unchanged', () => {
    expect(getStatusMessage('archived')).toBe('archived');
  });

  it('defaults to pending when neither status nor envelope is provided', () => {
    render(<StatusIndicator />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('derives the status from the envelope when no status is given', () => {
    render(<StatusIndicator envelope={makeEnvelope({ status: 'declined' })} />);
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });

  it('reports partly-signed when some but not all recipients have submitted', () => {
    const envelope = makeEnvelope({
      status: 'in progress',
      recipients: [makeRecipient({ status: 'submitted' }), makeRecipient({ role_name: 'Signer 2', status: 'invited' })],
    });

    render(<StatusIndicator envelope={envelope} />);
    expect(screen.getByText('Partly Signed')).toBeInTheDocument();
  });

  it('does not report partly-signed when every recipient has submitted', () => {
    const envelope = makeEnvelope({
      status: 'complete',
      recipients: [makeRecipient({ status: 'submitted' }), makeRecipient({ role_name: 'Signer 2', status: 'submitted' })],
    });

    render(<StatusIndicator envelope={envelope} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('prefers an explicit status over the envelope', () => {
    render(<StatusIndicator status="canceled" envelope={makeEnvelope({ status: 'complete' })} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it.each([
    ['invited', 'var(--vdocs-color-accent, #654dcb)'],
    ['opened', 'var(--vdocs-color-accent, #654dcb)'],
    ['accepted', 'var(--vdocs-color-accent, #654dcb)'],
    ['signed', 'var(--vdocs-color-accent, #654dcb)'],
    ['some-signed', 'var(--vdocs-color-primary, #55bc81)'],
    ['submitted', 'var(--vdocs-color-primary, #55bc81)'],
    ['complete', 'var(--vdocs-color-primary, #55bc81)'],
    ['declined', '#ff0000'],
    ['canceled', '#999999'],
    ['in progress', '#999999'],
    ['pending', '#999999'],
    ['anything-else', '#999999'],
  ])('maps the %s status to color %s', (status, color) => {
    expect(getStatusColor(status)).toBe(color);
  });

  it('colors the declined icon per theme', () => {
    const light = render(<StatusIndicator status="declined" />);
    expect(light.container.querySelector('svg path')).toHaveAttribute('fill', '#ff0000');
    light.unmount();

    const dark = render(<StatusIndicator status="declined" theme="dark" />);
    expect(dark.container.querySelector('svg path')).toHaveAttribute('fill', '#f95353');
  });

  it('renders the same artwork for submitted and complete', () => {
    const submitted = render(<StatusIndicator status="submitted" />);
    const submittedPath = submitted.container.querySelector('svg path')?.getAttribute('d');
    submitted.unmount();

    const complete = render(<StatusIndicator status="complete" />);
    expect(complete.container.querySelector('svg path')).toHaveAttribute('d', submittedPath!);
  });
});
