import type { ITemplate } from '@verdocs/js-sdk';
import { QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { getTemplate, updateTemplate } from '@verdocs/js-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import VerdocsProvider from '../../provider/VerdocsProvider';
import TemplateSettings from './TemplateSettings';
import { TEST_API_BASE } from '../../test/setup';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getTemplate: vi.fn(),
    updateTemplate: vi.fn(),
  };
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    visibility: 'private',
    sender: 'envelope_creator',
    initial_reminder: null,
    followup_reminders: null,
    roles: [],
    fields: [],
    documents: [],
    ...overrides,
  }) as ITemplate;

const renderSettings = (props = {}, queryClient?: QueryClient) =>
  render(
    <VerdocsProvider baseUrl={TEST_API_BASE} queryClient={queryClient}>
      <TemplateSettings templateId="template-1" {...props} />
    </VerdocsProvider>,
  );

describe('TemplateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate());
  });

  it('loads the current settings into the form', async () => {
    renderSettings();

    expect(await screen.findByDisplayValue('Lease Agreement')).toBeInTheDocument();
    expect(screen.getByLabelText(/Visibility/)).toHaveValue('private');
    expect(screen.getByLabelText(/Owner for envelopes/)).toHaveValue('envelope_creator');
    expect(screen.getByRole('switch', { name: 'Send Reminders' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves edits and reports the updated template', async () => {
    const updated = makeTemplate({ name: 'Renamed' });
    vi.mocked(updateTemplate).mockResolvedValue(updated);
    const onSettingsChanged = vi.fn();

    renderSettings({ onSettingsChanged });

    const nameInput = await screen.findByDisplayValue('Lease Agreement');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Renamed');
    await userEvent.selectOptions(screen.getByLabelText(/Visibility/), 'shared');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(vi.mocked(updateTemplate)).toHaveBeenCalledWith(expect.anything(), 'template-1', {
        name: 'Renamed',
        visibility: 'shared',
        sender: 'envelope_creator',
        initial_reminder: null,
        followup_reminders: null,
      });
    });

    await waitFor(() => {
      expect(onSettingsChanged).toHaveBeenCalledWith(expect.objectContaining({ template: updated }));
    });
  });

  it('converts reminder days to milliseconds when reminders are enabled', async () => {
    vi.mocked(updateTemplate).mockResolvedValue(makeTemplate());

    renderSettings();

    await screen.findByDisplayValue('Lease Agreement');
    await userEvent.click(screen.getByRole('switch', { name: 'Send Reminders' }));

    const firstReminder = screen.getByLabelText(/First Reminder/);
    await userEvent.clear(firstReminder);
    await userEvent.type(firstReminder, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(vi.mocked(updateTemplate)).toHaveBeenCalledWith(
        expect.anything(),
        'template-1',
        expect.objectContaining({ initial_reminder: 3 * MS_PER_DAY, followup_reminders: 0 }),
      );
    });
  });

  it('fires onCancel when the user cancels', async () => {
    const onCancel = vi.fn();
    renderSettings({ onCancel });

    await screen.findByDisplayValue('Lease Agreement');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('reports load errors and shows the error state', async () => {
    vi.mocked(getTemplate).mockRejectedValue(Object.assign(new Error('boom'), { response: { status: 404 } }));
    const onSdkError = vi.fn();

    renderSettings({ onSdkError }, new QueryClient({ defaultOptions: { queries: { retry: false } } }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load this template/);
    await waitFor(() => {
      expect(onSdkError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom', statusCode: 404 }));
    });
  });
});
