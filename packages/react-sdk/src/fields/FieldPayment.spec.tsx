import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldPayment from './FieldPayment';

const buildField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: 'env-1',
  document_id: 'doc-1',
  name: 'recipient-1-payment-1',
  role_name: 'Recipient 1',
  type: 'payment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 300,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('FieldPayment', () => {
  it('renders the payment affordance and reports clicks when unpaid', async () => {
    const user = userEvent.setup();
    const onBeginPayment = vi.fn();
    render(<FieldPayment field={buildField()} onBeginPayment={onBeginPayment} />);

    await user.click(screen.getByRole('button', { name: 'Payment' }));

    expect(onBeginPayment).toHaveBeenCalledOnce();
  });

  it('does not begin payment when disabled', async () => {
    const user = userEvent.setup();
    const onBeginPayment = vi.fn();
    render(<FieldPayment field={buildField()} disabled onBeginPayment={onBeginPayment} />);

    await user.click(screen.getByRole('button', { name: 'Payment' }));

    expect(onBeginPayment).not.toHaveBeenCalled();
  });

  it('renders the paid treatment instead of the affordance when paid', () => {
    render(<FieldPayment field={buildField()} paid />);

    expect(screen.getByRole('img', { name: 'Paid' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the paid treatment when done', () => {
    render(<FieldPayment field={buildField()} done />);

    expect(screen.getByRole('img', { name: 'Paid' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('focuses the affordance when focused is set', () => {
    render(<FieldPayment field={buildField()} focused />);

    expect(screen.getByRole('button', { name: 'Payment' })).toHaveFocus();
  });

  it('applies the signer color class for the signer index', () => {
    render(<FieldPayment field={buildField()} signerIndex={1} className="probe" />);

    expect(document.querySelector('.probe')).toHaveClass('vdocs-signer-2');
  });

  it('marks the field with the disabled state class when disabled', () => {
    render(<FieldPayment field={buildField()} disabled className="probe" />);

    expect(document.querySelector('.probe')).toHaveClass('vdocs-disabled');
  });
});
