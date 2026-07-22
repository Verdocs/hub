import type { ITemplate } from '@verdocs/js-sdk';
import { createTemplate } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import { act, render, screen, waitFor } from '@testing-library/react';
import VerdocsProvider from '../../provider/VerdocsProvider';
import TemplateCreate from './TemplateCreate';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    createTemplate: vi.fn(),
  };
});

const pdf = (name: string) => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

const created = { id: 't-new', name: 'Lease.pdf' } as ITemplate;

const renderCreate = (props = {}) =>
  render(
    <VerdocsProvider baseUrl="https://stage-api.verdocs.com">
      <TemplateCreate {...props} />
    </VerdocsProvider>,
  );

describe('TemplateCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(createTemplate).mockResolvedValue(created);
  });

  it('disables Create until a file is chosen, then prefills the name', async () => {
    const user = userEvent.setup();
    renderCreate();

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await user.upload(screen.getByLabelText('Select a file'), pdf('Lease.pdf'));

    expect(screen.getByRole('textbox')).toHaveValue('Lease.pdf');
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('keeps a name the user typed when a file is chosen later', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByRole('textbox'), 'Rental Agreement');
    await user.upload(screen.getByLabelText('Select a file'), pdf('Lease.pdf'));

    expect(screen.getByRole('textbox')).toHaveValue('Rental Agreement');
  });

  it('creates the template and reports it through onTemplateCreated', async () => {
    const user = userEvent.setup();
    const onTemplateCreated = vi.fn();
    renderCreate({ onTemplateCreated });

    const file = pdf('Lease.pdf');
    await user.upload(screen.getByLabelText('Select a file'), file);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onTemplateCreated).toHaveBeenCalledWith(created);
    });

    expect(vi.mocked(createTemplate)).toHaveBeenCalledWith(expect.anything(), { name: 'Lease.pdf', documents: [file] });
  });

  it('disables the form while the create is pending', async () => {
    let resolveCreate!: (template: ITemplate) => void;
    vi.mocked(createTemplate).mockImplementation(
      () =>
        new Promise<ITemplate>(resolve => {
          resolveCreate = resolve;
        }),
    );

    const user = userEvent.setup();
    const onTemplateCreated = vi.fn();
    renderCreate({ onTemplateCreated });

    await user.upload(screen.getByLabelText('Select a file'), pdf('Lease.pdf'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByText('Creating template...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(onTemplateCreated).not.toHaveBeenCalled();

    await act(async () => {
      resolveCreate(created);
    });

    await waitFor(() => {
      expect(onTemplateCreated).toHaveBeenCalledWith(created);
    });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });

  it('reports failures through onSdkError', async () => {
    vi.mocked(createTemplate).mockRejectedValue(
      Object.assign(new Error('Create failed'), { response: { status: 400, data: { code: 'invalid' } } }),
    );

    const user = userEvent.setup();
    const onSdkError = vi.fn();
    renderCreate({ onSdkError });

    await user.upload(screen.getByLabelText('Select a file'), pdf('Lease.pdf'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(onSdkError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Create failed', statusCode: 400, response: { code: 'invalid' } }),
      );
    });
  });

  it('shows the size error and blocks submit for oversized files', async () => {
    const user = userEvent.setup();
    renderCreate({ maxSize: 4 });

    await user.upload(screen.getByLabelText('Select a file'), pdf('Lease.pdf'));

    expect(screen.getByText('Total file size must not exceed 20MB.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('fires onCancel when the user cancels', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderCreate({ onCancel });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createTemplate)).not.toHaveBeenCalled();
  });
});
