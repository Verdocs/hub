import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldTextbox from './FieldTextbox';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-textbox-1',
  role_name: 'Recipient 1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 180,
  y: 260,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('FieldTextbox', () => {
  it('renders the current value and placeholder', () => {
    const { unmount } = render(<FieldTextbox field={sampleField({ value: 'Jane Smith' })} />);
    expect(screen.getByRole('textbox', { name: 'Buyer-textbox-1' })).toHaveValue('Jane Smith');
    unmount();

    render(<FieldTextbox field={sampleField()} />);
    expect(screen.getByPlaceholderText('Full name')).toHaveValue('');
  });

  it('fires onFieldChange with the updated text', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldTextbox field={sampleField()} onFieldChange={onFieldChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Jane');

    expect(input).toHaveValue('Jane');
    expect(onFieldChange).toHaveBeenLastCalledWith('Jane');
  });

  it('caps input length based on the field width', async () => {
    const user = userEvent.setup();
    render(<FieldTextbox field={sampleField({ width: 50 })} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '123456789012345');

    expect(input).toHaveValue('1234567890');
  });

  it('blocks input when disabled or the field is readonly', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    const { unmount } = render(<FieldTextbox field={sampleField()} disabled onFieldChange={onFieldChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();

    await user.type(input, 'nope');
    expect(onFieldChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
    unmount();

    render(<FieldTextbox field={sampleField({ readonly: true })} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders the value as plain text when done', () => {
    render(<FieldTextbox field={sampleField({ value: 'Jane Smith' })} done />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
