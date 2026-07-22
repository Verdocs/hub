import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Dialog from './Dialog';

describe('Dialog', () => {
  it('renders heading, body, and footer in a modal', () => {
    render(
      <Dialog heading="Test Title" footer={<button type="button">Confirm</button>}>
        Body text
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('closes via the close button and the overlay, but not body clicks', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog heading="T" onClose={onClose}>Body</Dialog>);

    await user.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('ignores overlay clicks when persistent', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog heading="T" persistent onClose={onClose}>Body</Dialog>);

    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).not.toHaveBeenCalled();

    // The explicit close button still works on persistent dialogs
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
