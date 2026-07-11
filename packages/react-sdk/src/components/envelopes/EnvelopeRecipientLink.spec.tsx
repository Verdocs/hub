import type { IRecipient } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import EnvelopeRecipientLink from './EnvelopeRecipientLink';

const makeRecipient = (overrides: Partial<IRecipient> = {}): IRecipient =>
  ({
    envelope_id: 'envelope-1',
    role_name: 'Signer 1',
    first_name: 'Paige',
    last_name: 'Turner',
    email: 'paige.turner@example.com',
    phone: null,
    sequence: 1,
    status: 'invited',
    ...overrides,
  }) as IRecipient;

describe('EnvelopeRecipientLink', () => {
  it('renders the recipient role, name, and email', () => {
    render(<EnvelopeRecipientLink recipient={makeRecipient()} />);

    expect(screen.getByText('In-Person Signing Link')).toBeInTheDocument();
    expect(screen.getByText('Signer 1')).toBeInTheDocument();
    expect(screen.getByText(/Paige Turner/)).toBeInTheDocument();
    expect(screen.getByText(/paige\.turner@example\.com/)).toBeInTheDocument();
  });

  it('falls back to the phone number when the recipient has no email', () => {
    render(<EnvelopeRecipientLink recipient={makeRecipient({ email: '', phone: '+15555551212' })} />);
    expect(screen.getByText(/\+15555551212/)).toBeInTheDocument();
  });

  it('requests the link through onGetLink', async () => {
    const user = userEvent.setup();
    const onGetLink = vi.fn();
    const recipient = makeRecipient();
    render(<EnvelopeRecipientLink recipient={recipient} onGetLink={onGetLink} />);

    await user.click(screen.getByRole('button', { name: 'Get Link' }));

    expect(onGetLink).toHaveBeenCalledWith(recipient);
  });

  it('shows a disabled loading state while the link is being fetched', () => {
    render(<EnvelopeRecipientLink recipient={makeRecipient()} gettingLink />);

    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });

  it('shows the link and copies it to the clipboard', async () => {
    const user = userEvent.setup();
    const link = 'https://app.verdocs.com/sign/in-person/abc123';
    render(<EnvelopeRecipientLink recipient={makeRecipient()} link={link} />);

    expect(screen.getByText(link)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get Link' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    await expect(navigator.clipboard.readText()).resolves.toBe(link);
    expect(await screen.findByText('Link copied to clipboard!')).toBeInTheDocument();
  });

  it('fires onDone when Done is clicked', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<EnvelopeRecipientLink recipient={makeRecipient()} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(onDone).toHaveBeenCalled();
  });
});
