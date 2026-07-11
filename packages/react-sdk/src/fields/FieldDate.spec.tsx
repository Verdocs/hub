import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldDate from './FieldDate';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'lease-start-1',
  role_name: 'Recipient 1',
  type: 'date',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Lease Start',
  prepared: false,
  page: 1,
  x: 96,
  y: 220,
  width: 74,
  height: 20,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

describe('FieldDate', () => {
  it('seeds a native date input from the field value', () => {
    render(<FieldDate field={sampleField({ value: '2026-08-01' })} />);

    const input = screen.getByLabelText('Lease Start');
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveValue('2026-08-01');
  });

  it('trims full ISO timestamps to the date the input understands', () => {
    render(<FieldDate field={sampleField({ value: '2026-08-01T15:30:00.000Z' })} />);

    expect(screen.getByLabelText('Lease Start')).toHaveValue('2026-08-01');
  });

  it('reports picked dates as ISO yyyy-mm-dd strings', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<FieldDate field={sampleField()} onFieldChange={onFieldChange} />);

    await user.type(screen.getByLabelText('Lease Start'), '2026-08-15');

    expect(onFieldChange).toHaveBeenLastCalledWith('2026-08-15');
  });

  it('disables input when disabled or the field is readonly, and marks required fields', () => {
    const { container, rerender } = render(<FieldDate field={sampleField({ required: true })} disabled />);
    expect(screen.getByLabelText('Lease Start')).toBeDisabled();
    expect(screen.getByLabelText('Lease Start')).toBeRequired();
    expect(container.firstChild).toHaveClass('vdocs-field-required');

    rerender(<FieldDate field={sampleField({ readonly: true })} />);
    expect(screen.getByLabelText('Lease Start')).toBeDisabled();
  });

  it('renders the final date as local text when done', () => {
    const { container } = render(<FieldDate field={sampleField({ value: '2026-08-01' })} done />);

    expect(screen.queryByLabelText('Lease Start')).not.toBeInTheDocument();
    expect(screen.getByText(new Date(2026, 7, 1).toLocaleDateString())).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('vdocs-field-done');
  });
});
