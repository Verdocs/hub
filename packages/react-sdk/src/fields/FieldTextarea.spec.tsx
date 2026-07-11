import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldTextarea from './FieldTextarea';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'special-instructions-1',
  role_name: 'Recipient 1',
  type: 'textarea',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Special Instructions',
  prepared: false,
  page: 1,
  x: 120,
  y: 480,
  width: 150,
  height: 45,
  default: null,
  placeholder: 'Anything the property manager should know',
  multiline: true,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

describe('FieldTextarea', () => {
  it('renders the current value with the signer wrapper class', () => {
    const { container } = render(<FieldTextarea field={sampleField({ value: 'Gate code is 4482.' })} signerIndex={1} />);

    expect(screen.getByRole('textbox', { name: 'Special Instructions' })).toHaveValue('Gate code is 4482.');
    expect(container.firstChild).toHaveClass('vdocs-field', 'vdocs-signer-2');
  });

  it('reports edits through onFieldChange', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldTextarea field={sampleField()} onFieldChange={onFieldChange} />);

    await user.type(screen.getByRole('textbox'), 'Hi');

    expect(onFieldChange).toHaveBeenLastCalledWith('Hi');
  });

  it('disables input when disabled or the field is readonly', () => {
    const { rerender } = render(<FieldTextarea field={sampleField()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();

    rerender(<FieldTextarea field={sampleField({ readonly: true })} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('marks required fields on the input and the wrapper', () => {
    const { container } = render(<FieldTextarea field={sampleField({ required: true })} />);

    expect(screen.getByRole('textbox')).toBeRequired();
    expect(container.firstChild).toHaveClass('vdocs-field-required');
  });

  it('renders the final value without an input when done', () => {
    const { container } = render(<FieldTextarea field={sampleField({ value: 'Signed and sealed' })} done />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Signed and sealed')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('vdocs-field-done');
    expect(container.firstChild).not.toHaveClass('vdocs-signer-1');
  });
});
