import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldDropdown from './FieldDropdown';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-dropdown-1',
  role_name: 'Recipient 1',
  type: 'dropdown',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 220,
  y: 500,
  width: 85,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: [
    { id: 'purchase', label: 'Purchase' },
    { id: 'refinance', label: 'Refinance' },
    { id: 'cash-out', label: 'Cash Out' },
  ],
  value: null,
  is_valid: true,
  ...overrides,
});

describe('FieldDropdown', () => {
  it('renders the options and the current value', () => {
    render(<FieldDropdown field={sampleField({ value: 'refinance' })} />);

    const select = screen.getByRole('combobox', { name: 'Buyer-dropdown-1' });
    expect(select).toHaveValue('refinance');
    expect(screen.getByRole('option', { name: 'Cash Out' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Select...' })).toBeInTheDocument();
  });

  it('fires onFieldChange with the selected option id', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldDropdown field={sampleField()} onFieldChange={onFieldChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'cash-out');

    expect(select).toHaveValue('cash-out');
    expect(onFieldChange).toHaveBeenCalledOnce();
    expect(onFieldChange).toHaveBeenCalledWith('cash-out');
  });

  it('disables the select when disabled or the field is readonly', () => {
    const { unmount } = render(<FieldDropdown field={sampleField()} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    unmount();

    render(<FieldDropdown field={sampleField({ readonly: true })} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('falls back to an N/A option when the field has none', () => {
    render(<FieldDropdown field={sampleField({ options: null })} />);

    expect(screen.getByRole('option', { name: 'N/A' })).toBeInTheDocument();
  });

  it('renders the value as plain text when done', () => {
    render(<FieldDropdown field={sampleField({ value: 'refinance' })} done />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('refinance')).toBeInTheDocument();
  });
});
