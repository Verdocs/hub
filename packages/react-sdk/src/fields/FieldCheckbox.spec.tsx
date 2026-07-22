import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldCheckbox from './FieldCheckbox';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  document_id: '626af9d6-f9d5-4ad9-94c7-13e57d515d43',
  name: 'Buyer-checkbox-1',
  role_name: 'Recipient 1',
  type: 'checkbox',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: null,
  prepared: false,
  page: 1,
  x: 120,
  y: 340,
  width: 16,
  height: 16,
  default: null,
  placeholder: null,
  multiline: false,
  group: 'purchase-options',
  options: null,
  value: null,
  is_valid: true,
  ...overrides,
});

describe('FieldCheckbox', () => {
  it('renders unchecked when the field has no value', () => {
    render(<FieldCheckbox field={sampleField()} />);

    expect(screen.getByRole('checkbox', { name: 'Buyer-checkbox-1' })).not.toBeChecked();
  });

  it('renders checked from the field value', () => {
    render(<FieldCheckbox field={sampleField({ value: 'true' })} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('fires onFieldChange with the new checked state', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldCheckbox field={sampleField()} onFieldChange={onFieldChange} />);

    const box = screen.getByRole('checkbox');
    await user.click(box);
    expect(onFieldChange).toHaveBeenLastCalledWith(true);

    await user.click(box);
    expect(onFieldChange).toHaveBeenLastCalledWith(false);
  });

  it('cannot be toggled when disabled', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldCheckbox field={sampleField()} disabled onFieldChange={onFieldChange} />);

    const box = screen.getByRole('checkbox');
    expect(box).toBeDisabled();

    await user.click(box);
    expect(onFieldChange).not.toHaveBeenCalled();
    expect(box).not.toBeChecked();
  });

  it('disables the input for readonly fields', () => {
    render(<FieldCheckbox field={sampleField({ readonly: true })} />);

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('renders the final glyph instead of an input when done', () => {
    const { unmount } = render(<FieldCheckbox field={sampleField({ value: 'true' })} done />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Checked' })).toBeInTheDocument();
    unmount();

    render(<FieldCheckbox field={sampleField()} done />);
    expect(screen.getByRole('img', { name: 'Unchecked' })).toBeInTheDocument();
  });
});
