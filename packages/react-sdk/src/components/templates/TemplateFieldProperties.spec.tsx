import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { ITemplate, ITemplateField } from '@verdocs/js-sdk';
import TemplateFieldProperties from './TemplateFieldProperties';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'tpl-1',
  document_id: 'doc-1',
  type: 'textbox',
  required: true,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: 'Legal name',
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: 'Full name',
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

interface IRecordedCall {
  method: string;
  url: string;
  body?: Record<string, unknown>;
}

// Fakes the API at the axios layer, the same place axios-mock-adapter hooks in
// (that package is not a react-sdk dependency), so the real js-sdk request
// paths run end to end.
const installFakeApi = (endpoint: VerdocsEndpoint, serverTemplate: ITemplate) => {
  const calls: IRecordedCall[] = [];

  endpoint.api.defaults.adapter = async config => {
    const method = (config.method || 'get').toLowerCase();
    const url = config.url || '';
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    calls.push({ method, url, body });

    const respond = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config });

    if (method === 'get' && url === '/v2/templates/tpl-1') {
      return respond(serverTemplate);
    }

    if (method === 'patch' && url.startsWith('/v2/fields/tpl-1/')) {
      const name = decodeURIComponent(url.split('/').pop() || '');
      const index = (serverTemplate.fields || []).findIndex(field => field.name === name);
      serverTemplate.fields![index] = { ...serverTemplate.fields![index], ...body };
      return respond(serverTemplate.fields![index]);
    }

    if (method === 'delete' && url.startsWith('/v2/fields/tpl-1/')) {
      const name = decodeURIComponent(url.split('/').pop() || '');
      serverTemplate.fields = (serverTemplate.fields || []).filter(field => field.name !== name);
      return respond({});
    }

    throw new Error(`Unexpected request: ${method} ${url}`);
  };

  return calls;
};

const renderPanel = (field: ITemplateField, props = {}) => {
  const serverTemplate = {
    id: 'tpl-1',
    name: 'Test Template',
    roles: [{ name: 'Recipient 1', sequence: 1 }, { name: 'Recipient 2', sequence: 2 }],
    fields: [field],
  } as ITemplate;

  const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
  const calls = installFakeApi(endpoint, serverTemplate);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <VerdocsProvider endpoint={endpoint} queryClient={queryClient}>
      <TemplateFieldProperties templateId="tpl-1" fieldName={field.name} {...props} />
    </VerdocsProvider>,
  );

  return calls;
};

describe('TemplateFieldProperties', () => {
  it('seeds the form from the field settings', async () => {
    renderPanel(makeField());

    expect(await screen.findByText('Textbox Settings')).toBeInTheDocument();
    expect(screen.getByLabelText(/Field Name/)).toHaveValue('textboxP1-1');
    expect(screen.getByLabelText(/Optional Label/)).toHaveValue('Legal name');
    expect(screen.getByLabelText(/Role/)).toHaveValue('Recipient 1');
    expect(screen.getByLabelText('Required')).toBeChecked();
    expect(screen.getByLabelText('Read-only')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('saves edited settings and reports them', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSettingsChanged = vi.fn();
    const calls = renderPanel(makeField(), { onClose, onSettingsChanged });

    await screen.findByText('Textbox Settings');
    await user.click(screen.getByLabelText('Read-only'));
    await user.type(screen.getByLabelText(/Default Value/), 'Jane Smith');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(calls).toContainEqual(expect.objectContaining({
        method: 'patch',
        url: '/v2/fields/tpl-1/textboxP1-1',
        body: expect.objectContaining({ readonly: true, default: 'Jane Smith', required: true }),
      }));
    });

    await waitFor(() => {
      expect(onSettingsChanged).toHaveBeenCalledWith(expect.objectContaining({
        fieldName: 'textboxP1-1',
        field: expect.objectContaining({ readonly: true, default: 'Jane Smith' }),
      }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('blocks saving a read-only field without a default value', async () => {
    const user = userEvent.setup();
    renderPanel(makeField());

    await screen.findByText('Textbox Settings');
    await user.click(screen.getByLabelText('Read-only'));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByLabelText(/Default Value/)).toHaveAttribute('placeholder', 'Default value required');
  });

  it('deletes the field and reports the deletion', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const calls = renderPanel(makeField(), { onClose, onDelete });

    await screen.findByText('Textbox Settings');
    await user.click(screen.getByRole('button', { name: 'Delete field' }));

    await waitFor(() => {
      expect(calls).toContainEqual(expect.objectContaining({ method: 'delete', url: '/v2/fields/tpl-1/textboxP1-1' }));
    });

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith({ templateId: 'tpl-1', fieldName: 'textboxP1-1' });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('disables deletion once the form is dirty', async () => {
    const user = userEvent.setup();
    renderPanel(makeField());

    await screen.findByText('Textbox Settings');
    expect(screen.getByRole('button', { name: 'Delete field' })).toBeEnabled();

    await user.type(screen.getByLabelText(/Optional Label/), '!');
    expect(screen.getByRole('button', { name: 'Delete field' })).toBeDisabled();
  });

  it('edits dropdown options with a trailing blank row and requires one option to save', async () => {
    const user = userEvent.setup();
    const calls = renderPanel(makeField({
      name: 'dropdownP1-1',
      type: 'dropdown',
      label: null,
      placeholder: null,
      options: [{ id: 'yes', label: 'Yes' }],
    }));

    expect(await screen.findByText('Dropdown Settings')).toBeInTheDocument();

    // One filled row plus the blank row for adding the next entry.
    expect(screen.getByLabelText('Option 1 ID')).toHaveValue('yes');
    expect(screen.getByLabelText('Option 2 ID')).toHaveValue('');

    // Clearing the only filled row leaves no options, which blocks saving.
    await user.click(screen.getByRole('button', { name: 'Remove option 1' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByLabelText('Option 1 ID'), 'no');
    await user.type(screen.getByLabelText('Option 1 label'), 'No');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(calls).toContainEqual(expect.objectContaining({
        method: 'patch',
        url: '/v2/fields/tpl-1/dropdownP1-1',
        body: expect.objectContaining({ options: [{ id: 'no', label: 'No' }] }),
      }));
    });
  });

  it('resets edits and closes on cancel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPanel(makeField(), { onClose });

    await screen.findByText('Textbox Settings');
    await user.type(screen.getByLabelText(/Optional Label/), ' edited');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByLabelText(/Optional Label/)).toHaveValue('Legal name');
  });

  it('flips to the help view when helpText is provided', async () => {
    const user = userEvent.setup();
    renderPanel(makeField(), { helpText: 'Text boxes collect a single line of text.' });

    await screen.findByText('Textbox Settings');
    await user.click(screen.getByRole('button', { name: 'Show help' }));

    expect(screen.getByText('Text boxes collect a single line of text.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Field Name/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide help' }));
    expect(screen.getByLabelText(/Field Name/)).toBeInTheDocument();
  });
});
