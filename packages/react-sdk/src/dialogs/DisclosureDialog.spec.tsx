import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import DisclosureDialog from './DisclosureDialog';

describe('DisclosureDialog', () => {
  it('renders the heading and the default disclosure content', () => {
    render(<DisclosureDialog />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('e-Signature Disclosures')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Electronic Record and Signatures Disclosure' })).toHaveAttribute(
      'href',
      'https://verdocs.com/en/electronic-record-signature-disclosure/',
    );
    expect(screen.getByRole('link', { name: 'End User License Agreement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('renders custom disclosure content in place of the default', () => {
    render(<DisclosureDialog disclosures={<p>Acme custom consent text</p>} />);

    expect(screen.getByText('Acme custom consent text')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'End User License Agreement' })).not.toBeInTheDocument();
  });

  it('keeps Proceed disabled until the acceptance box is checked, then fires onAgree', async () => {
    const user = userEvent.setup();
    const onAgree = vi.fn();
    render(<DisclosureDialog onAgree={onAgree} />);

    const proceed = screen.getByRole('button', { name: 'Proceed' });
    expect(proceed).toBeDisabled();
    await user.click(proceed);
    expect(onAgree).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox'));
    expect(proceed).toBeEnabled();

    await user.click(proceed);
    expect(onAgree).toHaveBeenCalledTimes(1);
  });

  it('fires onDecline without requiring acceptance', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    render(<DisclosureDialog onDecline={onDecline} />);

    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('only offers Delegate when the recipient is a delegator, and fires onDelegate', async () => {
    const user = userEvent.setup();
    const onDelegate = vi.fn();

    const { unmount } = render(<DisclosureDialog />);
    expect(screen.queryByRole('button', { name: 'Delegate' })).not.toBeInTheDocument();
    unmount();

    render(<DisclosureDialog delegator onDelegate={onDelegate} />);
    await user.click(screen.getByRole('button', { name: 'Delegate' }));
    expect(onDelegate).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel when dismissed via the close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DisclosureDialog onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
