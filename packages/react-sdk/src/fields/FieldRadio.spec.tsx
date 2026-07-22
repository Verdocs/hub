import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldRadio from './FieldRadio';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-financing-cash',
  role_name: 'Recipient 1',
  type: 'radio',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 150,
  y: 410,
  width: 14,
  height: 14,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'financing-choice',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('FieldRadio', () => {
  it('renders unselected when the field has no value', () => {
    render(<FieldRadio field={sampleField()} />);

    expect(screen.getByRole('radio', { name: 'Buyer-financing-cash' })).not.toBeChecked();
  });

  it('renders selected from the field value', () => {
    render(<FieldRadio field={sampleField({ value: 'true' })} />);

    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('fires onFieldChange with the option id when selected', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldRadio field={sampleField()} onFieldChange={onFieldChange} />);

    await user.click(screen.getByRole('radio'));

    expect(onFieldChange).toHaveBeenCalledOnce();
    expect(onFieldChange).toHaveBeenCalledWith('Buyer-financing-cash');
  });

  it('cannot be selected when disabled', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldRadio field={sampleField()} disabled onFieldChange={onFieldChange} />);

    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();

    await user.click(radio);
    expect(onFieldChange).not.toHaveBeenCalled();
    expect(radio).not.toBeChecked();
  });

  it('disables the input for readonly fields', () => {
    render(<FieldRadio field={sampleField({ readonly: true })} />);

    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('renders the final glyph instead of an input when done', () => {
    const { unmount } = render(<FieldRadio field={sampleField({ value: 'true' })} done />);

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Selected' })).toBeInTheDocument();
    unmount();

    render(<FieldRadio field={sampleField()} done />);
    expect(screen.getByRole('img', { name: 'Not selected' })).toBeInTheDocument();
  });
});
