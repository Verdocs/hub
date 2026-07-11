import userEvent from '@testing-library/user-event';
import type { IEnvelopeField } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import FieldAttachment from './FieldAttachment';

const sampleField = (overrides: Partial<IEnvelopeField> = {}): IEnvelopeField => ({
  envelope_id: '4d0f8b3a-08c9-4bd1-b2ad-3f5a86d1e9c2',
  document_id: 'b9a7c2e1-55d4-4c3f-9d21-7e6f0a4b8c5d',
  name: 'proof-of-insurance-1',
  role_name: 'Recipient 1',
  type: 'attachment',
  required: false,
  readonly: false,
  settings: null,
  validator: null,
  label: 'Proof of Insurance',
  prepared: false,
  page: 1,
  x: 72,
  y: 590,
  width: 24,
  height: 24,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  value: '',
  is_valid: true,
  ...overrides,
});

const pdf = (name: string) => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

describe('FieldAttachment', () => {
  it('reports a picked file through onSelectFile', async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    render(<FieldAttachment field={sampleField()} onSelectFile={onSelectFile} />);

    expect(screen.getByRole('button', { name: 'Proof of Insurance' })).toBeInTheDocument();

    const file = pdf('renters-policy.pdf');
    await user.upload(screen.getByLabelText('Attach a file'), file);

    expect(onSelectFile).toHaveBeenCalledWith(file);
  });

  it('surfaces the attached file name and a delete affordance', async () => {
    const user = userEvent.setup();
    const onDeleteFile = vi.fn();
    render(<FieldAttachment field={sampleField({ value: 'renters-policy.pdf' })} onDeleteFile={onDeleteFile} />);

    expect(screen.getByRole('button', { name: 'Proof of Insurance' })).toHaveAttribute('title', 'renters-policy.pdf');

    await user.click(screen.getByRole('button', { name: 'Remove attachment' }));

    expect(onDeleteFile).toHaveBeenCalled();
  });

  it('deactivates when disabled or the field is readonly', () => {
    const { rerender } = render(<FieldAttachment field={sampleField({ value: 'renters-policy.pdf' })} disabled />);
    expect(screen.getByRole('button', { name: 'Proof of Insurance' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Remove attachment' })).not.toBeInTheDocument();

    rerender(<FieldAttachment field={sampleField({ readonly: true })} />);
    expect(screen.getByRole('button', { name: 'Proof of Insurance' })).toBeDisabled();
  });

  it('marks required fields on the wrapper', () => {
    const { container } = render(<FieldAttachment field={sampleField({ required: true })} />);

    expect(container.firstChild).toHaveClass('vdocs-field-required');
  });

  it('renders only a status icon when done', () => {
    const { container } = render(<FieldAttachment field={sampleField({ value: 'renters-policy.pdf' })} done />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTitle('File attached')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('vdocs-field-done');
  });
});
