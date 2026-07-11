import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import OkDialog from './OkDialog';

describe('OkDialog', () => {
  it('renders the heading and message and fires onOk', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(
      <OkDialog
        heading="You're Done!"
        message={<p>All set.</p>}
        onOk={onOk}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("You're Done!")).toBeInTheDocument();
    expect(screen.getByText('All set.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows a Cancel button and a custom OK label when asked', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(
      <OkDialog
        heading="Decline Signing Request"
        message="The sender will be notified."
        buttonLabel="Decline"
        showCancel
        onOk={onOk}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
  });

  it('treats dismissal as a cancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<OkDialog heading="T" message="M" onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
