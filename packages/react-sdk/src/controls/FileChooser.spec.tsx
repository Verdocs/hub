import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import FileChooser from './FileChooser';

const pdf = (name: string) => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

describe('FileChooser', () => {
  it('reports a selected file and updates the prompt', async () => {
    const onSelectFiles = vi.fn();
    render(<FileChooser onSelectFiles={onSelectFiles} />);

    expect(screen.getByText('Drag a file here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select a file from your computer' })).toBeInTheDocument();

    const file = pdf('contract.pdf');
    await userEvent.upload(screen.getByLabelText('Select a file'), file);

    expect(onSelectFiles).toHaveBeenCalledWith([file]);
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select a different file' })).toBeInTheDocument();
  });

  it('clears the selection when the user goes to pick a different file', async () => {
    const onSelectFiles = vi.fn();
    render(<FileChooser onSelectFiles={onSelectFiles} />);

    await userEvent.upload(screen.getByLabelText('Select a file'), pdf('contract.pdf'));
    await userEvent.click(screen.getByRole('button', { name: 'Select a different file' }));

    expect(onSelectFiles).toHaveBeenLastCalledWith([]);
    expect(screen.getByText('Drag a file here')).toBeInTheDocument();
  });

  it('accepts several files when multiple is set', async () => {
    const onSelectFiles = vi.fn();
    render(<FileChooser multiple onSelectFiles={onSelectFiles} />);

    const files = [pdf('nda.pdf'), pdf('lease.pdf')];
    await userEvent.upload(screen.getByLabelText('Select a file'), files);

    expect(onSelectFiles).toHaveBeenCalledWith(files);
    expect(screen.getByText('nda.pdf, lease.pdf')).toBeInTheDocument();
  });
});
