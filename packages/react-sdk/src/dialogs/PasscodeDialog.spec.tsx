import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import PasscodeDialog from './PasscodeDialog';

describe('PasscodeDialog', () => {
  it('submits the entered passcode and clears the input for the next attempt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasscodeDialog onSubmit={onSubmit} />);

    expect(screen.getByText('Passcode Required')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Enter passcode...');
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();

    await user.type(input, 'open-sesame');
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith('open-sesame');
    expect(input).toHaveValue('');
  });

  it('shows the error message when set', () => {
    render(<PasscodeDialog error="Invalid passcode. Please try again." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid passcode. Please try again.');
  });

  it('cancels from the Cancel button but not the overlay', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<PasscodeDialog onCancel={onCancel} />);

    // The legacy dialog was persistent: clicking the background does not dismiss it.
    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
