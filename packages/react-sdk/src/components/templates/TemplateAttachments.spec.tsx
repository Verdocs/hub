import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import { createTemplateDocument, deleteTemplateDocument, getTemplate } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import TemplateAttachments from './TemplateAttachments';
import { TEST_API_BASE } from '../../test/setup';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getTemplate: vi.fn(),
    createTemplateDocument: vi.fn(),
    deleteTemplateDocument: vi.fn(),
  };
});

const makeDocument = (overrides: Partial<ITemplateDocument>): ITemplateDocument =>
  ({
    id: 'doc-1',
    name: 'NDA.pdf',
    template_id: 'template-1',
    order: 0,
    pages: 3,
    mime: 'application/pdf',
    size: 12345,
    page_sizes: [],
    created_at: null,
    updated_at: null,
    ...overrides,
  }) as ITemplateDocument;

const documents = [
  makeDocument({ id: 'doc-1', name: 'NDA.pdf' }),
  makeDocument({ id: 'doc-2', name: 'Exhibit-A.docx', pages: 1, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
];

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    roles: [],
    fields: [],
    documents,
    ...overrides,
  }) as ITemplate;

const renderAttachments = (props = {}) =>
  render(
    <VerdocsProvider baseUrl={TEST_API_BASE}>
      <TemplateAttachments templateId="template-1" {...props} />
    </VerdocsProvider>,
  );

describe('TemplateAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate());
  });

  it('lists the template documents', async () => {
    renderAttachments();

    expect(await screen.findByText('NDA.pdf')).toBeInTheDocument();
    expect(screen.getByText('Exhibit-A.docx')).toBeInTheDocument();
    expect(screen.getByTitle('3 page(s)')).toBeInTheDocument();
  });

  it('uploads a selected file and reports the change', async () => {
    vi.mocked(createTemplateDocument).mockResolvedValue(makeDocument({ id: 'doc-3', name: 'Lease.pdf' }));
    const onAttachmentsChanged = vi.fn();

    renderAttachments({ onAttachmentsChanged });

    await screen.findByText('NDA.pdf');
    const file = new File(['dummy'], 'Lease.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('Select a file'), file);

    await waitFor(() => {
      expect(vi.mocked(createTemplateDocument)).toHaveBeenCalledWith(expect.anything(), 'template-1', file, expect.any(Function));
    });

    await waitFor(() => {
      expect(onAttachmentsChanged).toHaveBeenCalledWith(
        expect.objectContaining({ template: expect.objectContaining({ id: 'template-1' }) }),
      );
    });
  });

  it('deletes an attachment after the user confirms', async () => {
    vi.mocked(deleteTemplateDocument).mockResolvedValue(makeTemplate());
    const onAttachmentsChanged = vi.fn();

    renderAttachments({ onAttachmentsChanged });

    await screen.findByText('NDA.pdf');
    await userEvent.click(screen.getByRole('button', { name: 'Delete NDA.pdf' }));

    expect(screen.getByText('Delete this Attachment?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(vi.mocked(deleteTemplateDocument)).toHaveBeenCalledWith(expect.anything(), 'doc-1');
    });

    await waitFor(() => {
      expect(onAttachmentsChanged).toHaveBeenCalled();
    });
  });

  it('refuses to delete the last attachment', async () => {
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ documents: [documents[0]!] }));

    renderAttachments();

    await screen.findByText('NDA.pdf');
    await userEvent.click(screen.getByRole('button', { name: 'Delete NDA.pdf' }));

    expect(screen.getByText('Unable to Delete Attachment')).toBeInTheDocument();
    expect(vi.mocked(deleteTemplateDocument)).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByText('Unable to Delete Attachment')).not.toBeInTheDocument();
  });

  it('fires onNext with the template and onCancel when dismissed', async () => {
    const onNext = vi.fn();
    const onCancel = vi.fn();

    renderAttachments({ onNext, onCancel });

    await screen.findByText('NDA.pdf');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ template: expect.objectContaining({ id: 'template-1' }) }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables Next when the template has no documents', async () => {
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ documents: [] }));

    renderAttachments();

    expect(await screen.findByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
