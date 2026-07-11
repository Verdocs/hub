import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import DelegateDialog from './DelegateDialog';

describe('DelegateDialog', () => {
  it('disables Delegate until the required fields are filled, then submits the details', async () => {
    const user = userEvent.setup();
    const onDelegate = vi.fn();
    render(<DelegateDialog onDelegate={onDelegate} />);

    expect(screen.getByText('Delegate Signing')).toBeInTheDocument();
    const delegate = screen.getByRole('button', { name: 'Delegate' });
    expect(delegate).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Sue');
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Ridge');
    expect(delegate).toBeDisabled();

    await user.type(screen.getByPlaceholderText('New recipient email address'), 'sue@example.com');
    expect(delegate).toBeEnabled();

    await user.click(delegate);
    expect(onDelegate).toHaveBeenCalledWith({
      first_name: 'Sue',
      last_name: 'Ridge',
      email: 'sue@example.com',
      phone: '',
      message: '',
    });
  });

  it('includes the optional phone and message when provided', async () => {
    const user = userEvent.setup();
    const onDelegate = vi.fn();
    render(<DelegateDialog onDelegate={onDelegate} />);

    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Sue');
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Ridge');
    await user.type(screen.getByPlaceholderText('New recipient email address'), 'sue@example.com');
    await user.type(screen.getByPlaceholderText('Optional phone number'), '+15555550123');
    await user.type(screen.getByPlaceholderText('Type message here...'), 'Please sign this for me.');

    await user.click(screen.getByRole('button', { name: 'Delegate' }));
    expect(onDelegate).toHaveBeenCalledWith({
      first_name: 'Sue',
      last_name: 'Ridge',
      email: 'sue@example.com',
      phone: '+15555550123',
      message: 'Please sign this for me.',
    });
  });

  it('cancels from the Cancel button and the overlay', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DelegateDialog onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
