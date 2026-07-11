import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import UploadDialog from './UploadDialog';

const pdf = (name: string, content = '%PDF-1.4') => new File([content], name, { type: 'application/pdf' });

describe('UploadDialog', () => {
  it('enables Upload once a file is chosen and hands the files to onUpload', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<UploadDialog onUpload={onUpload} />);

    expect(screen.getByText('Upload attachment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();

    const file = pdf('contract.pdf');
    await user.upload(screen.getByLabelText('Select a file'), file);

    const upload = screen.getByRole('button', { name: 'Upload' });
    expect(upload).toBeEnabled();
    await user.click(upload);
    expect(onUpload).toHaveBeenCalledWith([file]);
  });

  it('flags selections over the size limit and keeps Upload disabled', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<UploadDialog maxSize={1024} onUpload={onUpload} />);

    await user.upload(screen.getByLabelText('Select a file'), pdf('big.pdf', 'x'.repeat(2048)));

    expect(screen.getByText('Total file size must not exceed 1KB.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('cancels via the Cancel button and dialog dismissal', async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const onCancel = vi.fn();
    render(<UploadDialog onUpload={onUpload} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onUpload).not.toHaveBeenCalled();
  });
});
