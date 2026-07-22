import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldInitial from './FieldInitial';

const buildField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: 'env-1',
  document_id: 'doc-1',
  name: 'recipient-1-initial-1',
  role_name: 'Recipient 1',
  type: 'initial',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 480,
  y: 640,
  width: 83,
  height: 36,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

const FAKE_URL = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';

describe('FieldInitial', () => {
  it('renders the initialing affordance and reports clicks when empty', async () => {
    const user = userEvent.setup();
    const onBeginSigning = vi.fn();
    render(<FieldInitial field={buildField()} onBeginSigning={onBeginSigning} />);

    await user.click(screen.getByRole('button', { name: 'Initial' }));

    expect(onBeginSigning).toHaveBeenCalledOnce();
  });

  it('does not begin signing when disabled', async () => {
    const user = userEvent.setup();
    const onBeginSigning = vi.fn();
    render(<FieldInitial field={buildField()} disabled onBeginSigning={onBeginSigning} />);

    await user.click(screen.getByRole('button', { name: 'Initial' }));

    expect(onBeginSigning).not.toHaveBeenCalled();
  });

  it('renders the adopted initials image instead of the affordance when filled', () => {
    render(<FieldInitial field={buildField()} initialUrl={FAKE_URL} />);

    expect(screen.getByRole('img', { name: 'Initial' })).toHaveAttribute('src', FAKE_URL);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders only the final image when done', () => {
    render(<FieldInitial field={buildField()} done initialUrl={FAKE_URL} />);

    expect(screen.getByRole('img', { name: 'Initial' })).toHaveAttribute('src', FAKE_URL);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('focuses the affordance when focused is set', () => {
    render(<FieldInitial field={buildField()} focused />);

    expect(screen.getByRole('button', { name: 'Initial' })).toHaveFocus();
  });

  it('applies the signer color class for the signer index', () => {
    render(<FieldInitial field={buildField()} signerIndex={1} className="probe" />);

    expect(document.querySelector('.probe')).toHaveClass('vdocs-signer-2');
  });

  it('marks required fields with the required state class', () => {
    render(<FieldInitial field={buildField({ required: true })} className="probe" />);

    expect(document.querySelector('.probe')).toHaveClass('vdocs-required');
  });
});
