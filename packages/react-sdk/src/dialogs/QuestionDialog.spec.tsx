import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import QuestionDialog from './QuestionDialog';

describe('QuestionDialog', () => {
  it('submits the typed question', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<QuestionDialog onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByText('Ask the Sender a Question')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Question' }), 'What is the deadline?');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(onSubmit).toHaveBeenCalledWith('What is the deadline?');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('prefills the question box and cancels without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<QuestionDialog question="Draft question" onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Draft question');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('treats dismissal as a cancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<QuestionDialog onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
