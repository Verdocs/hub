import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import SigningProgress from './SigningProgress';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-signature-1',
  role_name: 'Recipient 1',
  type: 'signature',
  required: true,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 120,
  height: 40,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const signature = sampleField();
const dateSigned = sampleField({ name: 'Buyer-date-1', type: 'date' });
const comments = sampleField({ name: 'Buyer-textbox-1', type: 'textbox', required: false });

describe('SigningProgress', () => {
  it('renders counts, the focused field label, and Start Signing in start mode', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<SigningProgress mode="start" fields={[signature, dateSigned]} focusedField="Buyer-signature-1" onStart={onStart} />);

    expect(screen.getByText('2 of 2 required fields remaining')).toBeInTheDocument();
    expect(screen.getByText('Required Signature*')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Signing' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('only shows the optional line when optional fields exist', () => {
    const { unmount } = render(<SigningProgress mode="signing" fields={[signature, dateSigned]} />);
    expect(screen.queryByText(/optional fields remaining/)).not.toBeInTheDocument();
    unmount();

    render(<SigningProgress mode="signing" fields={[signature, comments]} focusedField="Buyer-textbox-1" />);
    expect(screen.getByText('1 of 1 optional fields remaining')).toBeInTheDocument();
    expect(screen.getByText('Optional Text Field')).toBeInTheDocument();
  });

  it('counts filled fields as no longer remaining', () => {
    render(<SigningProgress mode="signing" fields={[sampleField({ value: 'signed' }), dateSigned]} />);

    expect(screen.getByText('1 of 2 required fields remaining')).toBeInTheDocument();
  });

  it('disables Previous on the first field and Next on the last, firing the callbacks between', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    const { unmount } = render(
      <SigningProgress mode="signing" fields={[signature, dateSigned]} focusedField="Buyer-signature-1" onNext={onNext} onPrevious={onPrevious} />,
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    unmount();

    render(<SigningProgress mode="signing" fields={[signature, dateSigned]} focusedField="Buyer-date-1" onNext={onNext} onPrevious={onPrevious} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('offers Submit once every required field is filled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const filled = [sampleField({ value: 'signed' }), sampleField({ name: 'Buyer-date-1', type: 'date', value: '2026-07-10' })];
    render(<SigningProgress mode="signing" fields={filled} focusedField="Buyer-date-1" onSubmit={onSubmit} />);

    expect(screen.getByText('0 of 2 required fields remaining')).toBeInTheDocument();
    expect(screen.getByText('Ready to submit.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders the completed card with Submit and no counts', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SigningProgress mode="completed" fields={[signature]} onSubmit={onSubmit} />);

    expect(screen.getByText('Ready to Submit')).toBeInTheDocument();
    expect(screen.getByText('You have entered all requested signatures. Select Submit to complete the signing process.')).toBeInTheDocument();
    expect(screen.queryByText(/required fields remaining/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('treats a grouped radio as filled only when its own value is selected', () => {
    // js-sdk's isFieldFilled would count the whole group as filled because the
    // sibling is selected; the card's stricter check keeps the focused radio open.
    const radioOn = sampleField({ name: 'Buyer-radio-1', type: 'radio', group: 'choices', value: 'true' });
    const radioOff = sampleField({ name: 'Buyer-radio-2', type: 'radio', group: 'choices', value: null });
    render(<SigningProgress mode="signing" fields={[radioOn, radioOff]} recipientFields={[radioOn, radioOff]} focusedField="Buyer-radio-2" />);

    expect(screen.getByText('1 of 2 required fields remaining')).toBeInTheDocument();
    expect(screen.getByText('Required Radio Button*')).toBeInTheDocument();
  });
});
