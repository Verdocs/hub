import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@testing-library/react';
import OtpDialog from './OtpDialog';

describe('OtpDialog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits the entered code and clears the input for the next attempt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<OtpDialog onSubmit={onSubmit} />);

    expect(screen.getByText('Verification Required')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Enter your one-time code...');
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();

    await user.type(input, '123456');
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith('123456');
    expect(input).toHaveValue('');
  });

  it('unlocks Resend after the cooldown and locks it again after resending', async () => {
    vi.useFakeTimers();
    const onResend = vi.fn();
    render(<OtpDialog onResend={onResend} />);

    const resend = screen.getByRole('button', { name: 'Resend' });
    expect(resend).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(resend).toBeEnabled();

    // Real timers from here: user-event stalls under fake ones, and the click only
    // needs to observe the immediate re-lock, not another 30 second wait.
    vi.useRealTimers();
    const user = userEvent.setup();
    await user.click(resend);
    expect(onResend).toHaveBeenCalledOnce();
    expect(resend).toBeDisabled();
  });

  it('shows the error message when set', () => {
    render(<OtpDialog error="Invalid verification code. Please try again." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid verification code. Please try again.');
  });

  it('cancels from the Cancel button but not the overlay', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<OtpDialog onCancel={onCancel} />);

    // The legacy dialog was persistent: clicking the background does not dismiss it.
    await user.click(screen.getByRole('dialog').parentElement!);
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
