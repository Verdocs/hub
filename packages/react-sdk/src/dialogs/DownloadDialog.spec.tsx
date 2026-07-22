import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import DownloadDialog from './DownloadDialog';

const sampleDocument = (overrides: Partial<IEnvelopeDocument> = {}): IEnvelopeDocument => ({
  id: 'a2ce2f1c-3f9d-4a91-b7c2-b3a1de23a6d1',
  envelope_id: '83da3d70-7857-4392-b876-c4592a304bc9',
  template_document_id: null,
  order: 1,
  type: 'attachment',
  name: 'Contract.pdf',
  pages: 4,
  mime: 'application/pdf',
  size: 182044,
  signed: true,
  page_sizes: [{ width: 612, height: 792 }],
  created_at: '2026-07-01T17:24:05.000Z',
  updated_at: '2026-07-01T17:31:12.000Z',
  ...overrides,
});

const contract = sampleDocument();
const addendum = sampleDocument({ id: 'b7f1a044-51f5-4f5e-8f52-9a41f9f2b902', order: 2, name: 'Addendum.pdf' });
const certificate = sampleDocument({ id: 'd44e8c72-6a1b-4b6e-b1de-5f0a2f9f61c8', order: 3, type: 'certificate', name: 'Certificate.pdf' });

describe('DownloadDialog', () => {
  it('renders a row per attachment plus the certificate, combined, and zip options', () => {
    render(<DownloadDialog documents={[contract, addendum, certificate]} signed />);

    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contract\.pdf/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Addendum\.pdf/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download the certificate/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Combined/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Files/ })).toBeInTheDocument();
    expect(screen.queryByText(/Multiple documents attached/)).not.toBeInTheDocument();
  });

  it('sorts attachments by order, then created_at', () => {
    const attachmentNames = () => screen.getAllByRole('button', { name: /Download the document/ }).map(row => row.textContent);

    // Same order: created_at breaks the tie.
    const later = sampleDocument({ id: 'later', name: 'Later.pdf', order: 1, created_at: '2026-07-02T00:00:00.000Z' });
    const earlier = sampleDocument({ id: 'earlier', name: 'Earlier.pdf', order: 1, created_at: '2026-07-01T00:00:00.000Z' });
    const { unmount } = render(<DownloadDialog documents={[later, earlier]} signed />);
    expect(attachmentNames()[0]).toContain('Earlier.pdf');
    expect(attachmentNames()[1]).toContain('Later.pdf');
    unmount();

    // Different orders: order wins even against an earlier created_at.
    const second = sampleDocument({ id: 'second', name: 'Second.pdf', order: 2, created_at: '2026-06-01T00:00:00.000Z' });
    const first = sampleDocument({ id: 'first', name: 'First.pdf', order: 1, created_at: '2026-07-02T00:00:00.000Z' });
    render(<DownloadDialog documents={[second, first]} signed />);
    expect(attachmentNames()[0]).toContain('First.pdf');
    expect(attachmentNames()[1]).toContain('Second.pdf');
  });

  it('replaces attachment rows with an info message when more than two attachments exist', () => {
    const exhibit = sampleDocument({ id: 'exhibit', order: 3, name: 'Exhibit.pdf' });
    render(<DownloadDialog documents={[contract, addendum, exhibit]} signed />);

    expect(screen.getByText('Multiple documents attached. Please use the ZIP option below to download all files.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Contract\.pdf/ })).not.toBeInTheDocument();
  });

  it('fires onDownload with the attachment even while the envelope is unsigned', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(<DownloadDialog documents={[contract]} onDownload={onDownload} />);

    // Unsigned attachments show the busy spinner rather than the Signed badge, but stay clickable.
    expect(screen.queryByText('Signed')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Contract\.pdf/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenLastCalledWith(contract, 'document');
  });

  it('marks attachments signed once the envelope is signed', () => {
    render(<DownloadDialog documents={[contract]} signed />);

    expect(screen.getByText('Signed')).toBeInTheDocument();
  });

  it('disables the certificate option until signed with a certificate available', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    const { unmount } = render(<DownloadDialog documents={[contract, certificate]} onDownload={onDownload} />);

    const certRow = screen.getByRole('button', { name: /Download the certificate/ });
    expect(certRow).toBeDisabled();
    expect(certRow).toHaveAttribute('title', 'Certificate not yet available');
    await user.click(certRow);
    expect(onDownload).not.toHaveBeenCalled();
    unmount();

    render(<DownloadDialog documents={[contract, certificate]} signed onDownload={onDownload} />);
    await user.click(screen.getByRole('button', { name: /Download the certificate/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenLastCalledWith(certificate, 'certificate');
  });

  it('fires the certificate variant with no document when only hasCertificate is set', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(<DownloadDialog documents={[contract]} signed hasCertificate onDownload={onDownload} />);

    await user.click(screen.getByRole('button', { name: /Download the certificate/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenLastCalledWith(undefined, 'certificate');
  });

  it('keeps combined disabled without the certificate document, then fires with it', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();

    // hasCertificate alone is not enough: merging needs the certificate document itself.
    const { unmount } = render(<DownloadDialog documents={[contract]} signed hasCertificate onDownload={onDownload} />);
    const combinedRow = screen.getByRole('button', { name: /Combined/ });
    expect(combinedRow).toBeDisabled();
    expect(combinedRow).toHaveAttribute('title', 'Waiting for all documents to be ready');
    unmount();

    render(<DownloadDialog documents={[contract, certificate]} signed onDownload={onDownload} />);
    await user.click(screen.getByRole('button', { name: /Combined/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenLastCalledWith(certificate, 'combined');
  });

  it('disables combined and zip while polling', () => {
    render(<DownloadDialog documents={[contract, certificate]} signed polling />);

    expect(screen.getByRole('button', { name: /Combined/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /All Files/ })).toBeDisabled();
  });

  it('fires the zip variant with no document when everything is ready', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(<DownloadDialog documents={[contract, certificate]} signed onDownload={onDownload} />);

    await user.click(screen.getByRole('button', { name: /All Files/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenLastCalledWith(undefined, 'zip');
  });

  it('fires onCancel when dismissed via the close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DownloadDialog documents={[contract]} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
