import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldTimestamp from './FieldTimestamp';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'signed-at-1',
  role_name: 'Recipient 1',
  type: 'timestamp',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Signed At',
  prepared: false,
  page: 1,
  x: 360,
  y: 640,
  width: 160,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

describe('FieldTimestamp', () => {
  it('hints that empty fields fill at signing time', () => {
    render(<FieldTimestamp field={sampleField()} />);

    expect(screen.getByText('Filled at signing')).toBeInTheDocument();
  });

  it('prefers the field placeholder for the hint', () => {
    render(<FieldTimestamp field={sampleField({ placeholder: 'Stamped on submit' })} />);

    expect(screen.getByText('Stamped on submit')).toBeInTheDocument();
    expect(screen.queryByText('Filled at signing')).not.toBeInTheDocument();
  });

  it('displays a set value as a localized timestamp with the signer class', () => {
    const value = '2026-07-10T14:32:05.000Z';
    const { container } = render(<FieldTimestamp field={sampleField({ value })} signerIndex={1} />);

    expect(screen.getByText(new Date(value).toLocaleString())).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('vdocs-field', 'vdocs-signer-2');
  });

  it('offers no input, and marks required fields on the wrapper', () => {
    const { container } = render(<FieldTimestamp field={sampleField({ required: true })} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('vdocs-field-required');
  });

  it('renders the done treatment with the final value', () => {
    const value = '2026-07-10T14:32:05.000Z';
    const { container } = render(<FieldTimestamp field={sampleField({ value })} done />);

    expect(screen.getByText(new Date(value).toLocaleString())).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('vdocs-field-done');
    expect(container.firstChild).not.toHaveClass('vdocs-signer-1');
  });
});
