import userEvent from '@testing-library/user-event';
import type { IKBAQuestion } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import KbaDialog from './KbaDialog';

const QUESTIONS: IKBAQuestion[] = [
  { type: 'q-address', prompt: 'Select your most recent address.', answer: ['553 Arbor Dr', '18 Lacey Ln', '23A Ball Ct'] },
  { type: 'q-county', prompt: 'Select the county you have lived in.', answer: ['Marion', 'Baldwin', 'None of the above'] },
];

const FULL_DETAILS = {
  first_name: 'Paige',
  last_name: 'Turner',
  address: '123 Main St',
  zip: '62704',
  ssn_last_4: '1234',
  dob: '1990-05-15',
};

describe('KbaDialog identity mode', () => {
  it('renders the identity form with no cancel button', () => {
    render(<KbaDialog mode="identity" />);

    expect(screen.getByText('Please Confirm Your Identity')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'First name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Last name' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Address...')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /I agree/ })).toBeInTheDocument();

    // The legacy identity form offered no cancel button, only the dialog dismiss affordances.
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('collects the entered details and fires onSubmitIdentity', async () => {
    const user = userEvent.setup();
    const onSubmitIdentity = vi.fn();
    render(<KbaDialog mode="identity" onSubmitIdentity={onSubmitIdentity} />);

    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText('First name...'), 'Paige');
    await user.type(screen.getByPlaceholderText('Last name...'), 'Turner');
    await user.type(screen.getByPlaceholderText('Address...'), '123 Main St');
    await user.type(screen.getByPlaceholderText('City...'), 'Springfield');
    await user.selectOptions(screen.getByRole('combobox'), 'IL');
    await user.type(screen.getByPlaceholderText('Zip Code...'), '62704');
    await user.type(screen.getByPlaceholderText('Last 4 digits of your Social Security Number...'), '1234');
    await user.type(screen.getByLabelText(/Date of Birth/), '1990-05-15');

    // Everything is filled in but the agreement box gates submission.
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmitIdentity).toHaveBeenCalledWith({
      first_name: 'Paige',
      last_name: 'Turner',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      ssn_last_4: '1234',
      dob: '1990-05-15',
    });
  });

  it('requires everything except city and state', async () => {
    const user = userEvent.setup();
    const first = render(<KbaDialog mode="identity" initialDetails={FULL_DETAILS} />);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
    first.unmount();

    render(<KbaDialog mode="identity" initialDetails={{ ...FULL_DETAILS, ssn_last_4: '' }} />);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});

describe('KbaDialog questions mode', () => {
  it('shows the help box, choices, and step counter', () => {
    render(<KbaDialog mode="questions" helpTitle="Verify your identity" questions={QUESTIONS} />);

    expect(screen.getByText('Verify your identity')).toBeInTheDocument();
    expect(screen.getByText('Select your most recent address.')).toBeInTheDocument();
    expect(screen.getByText('(1/2)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '553 Arbor Dr' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('steps through the questions, reporting each answer', async () => {
    const user = userEvent.setup();
    const onAnswerQuestion = vi.fn();
    render(<KbaDialog mode="questions" questions={QUESTIONS} onAnswerQuestion={onAnswerQuestion} />);

    await user.click(screen.getByRole('button', { name: '18 Lacey Ln' }));
    expect(screen.getByRole('button', { name: '18 Lacey Ln' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onAnswerQuestion).toHaveBeenCalledWith('q-address', '18 Lacey Ln');

    // The second (last) question resets the selection and switches the action to Submit.
    expect(screen.getByText('(2/2)')).toBeInTheDocument();
    expect(screen.getByText('Select the county you have lived in.')).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Marion' }));
    await user.click(submit);
    expect(onAnswerQuestion).toHaveBeenCalledWith('q-county', 'Marion');
    expect(onAnswerQuestion).toHaveBeenCalledTimes(2);
  });

  it('hides the step counter for a single question and cancels from the button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<KbaDialog mode="questions" questions={QUESTIONS.slice(0, 1)} onCancel={onCancel} />);

    expect(screen.queryByText('(1/1)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
