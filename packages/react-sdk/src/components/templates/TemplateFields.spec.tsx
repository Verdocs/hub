import { VerdocsEndpoint } from '@verdocs/js-sdk';
import { QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { ITemplate, ITemplateDocument, ITemplateField } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';
import TemplateFields from './TemplateFields';

const makeField = (overrides: Partial<ITemplateField> = {}): ITemplateField => ({
  name: 'textboxP1-1',
  role_name: 'Recipient 1',
  template_id: 'tpl-1',
  document_id: 'doc-1',
  type: 'textbox',
  required: false,
  readonly: false,
  settings: null,
  page: 1,
  validator: null,
  label: null,
  x: 100,
  y: 200,
  width: 150,
  height: 15,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
  ...overrides,
});

const makeTemplate = (): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    documents: [
      {
        id: 'doc-1',
        name: 'Contract.pdf',
        template_id: 'tpl-1',
        order: 1,
        pages: 1,
        page_sizes: { 1: { width: 612, height: 792 } } as unknown as ITemplateDocument['page_sizes'],
      } as ITemplateDocument,
    ],
    roles: [{ name: 'Recipient 1', sequence: 1 }],
    fields: [
      makeField(),
      makeField({ name: 'signatureP1-1', type: 'signature', x: 300, y: 400, width: 82, height: 36 }),
    ],
  }) as ITemplate;

interface IRecordedCall {
  method: string;
  url: string;
  body?: Record<string, unknown>;
}

// Fakes the API at the axios layer, the same place axios-mock-adapter hooks in
// (that package is not a react-sdk dependency), so the real js-sdk request
// paths run: URL construction, response handling, and cache invalidation.
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

    if (method === 'get' && url.startsWith('/v2/template-documents/page-image/doc-1/original/')) {
      return respond(`https://fake.test/page-${url.split('/').pop()}.png`);
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

const renderFields = (serverTemplate: ITemplate, props = {}) => {
  const endpoint = new VerdocsEndpoint({ baseURL: TEST_API_BASE, persist: false });
  const calls = installFakeApi(endpoint, serverTemplate);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <VerdocsProvider endpoint={endpoint} queryClient={queryClient}>
      <TemplateFields templateId="tpl-1" {...props} />
    </VerdocsProvider>,
  );

  return calls;
};

describe('TemplateFields', () => {
  it('renders the page image with each field component at its stored position', async () => {
    renderFields(makeTemplate());

    const image = await screen.findByAltText('Page 1');
    expect(image).toHaveAttribute('src', 'https://fake.test/page-1.png');

    // The textbox field renders the FieldTextbox input, the signature field
    // the FieldSignature affordance, each inside a positioned settings wrapper
    // placed in PDF coordinates (left from the left edge, bottom up from the
    // page bottom).
    expect(screen.getByRole('textbox', { name: 'textboxP1-1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Signature' })).toBeDisabled();

    expect(screen.getByRole('button', { name: 'textboxP1-1 settings' })).toHaveStyle({
      left: '100px',
      bottom: '200px',
      width: '150px',
      height: '15px',
    });
    expect(screen.getByRole('button', { name: 'signatureP1-1 settings' })).toHaveStyle({
      left: '300px',
      bottom: '400px',
      width: '82px',
      height: '36px',
    });
  });

  it('opens the properties panel on click and saves edits through the API', async () => {
    const user = userEvent.setup();
    const onTemplateUpdated = vi.fn();
    const calls = renderFields(makeTemplate(), { onTemplateUpdated });

    await user.click(await screen.findByRole('button', { name: 'textboxP1-1 settings' }));
    expect(await screen.findByText('Textbox Settings')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Optional Label/), 'Legal name');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(calls).toContainEqual(expect.objectContaining({
        method: 'patch',
        url: '/v2/fields/tpl-1/textboxP1-1',
        body: expect.objectContaining({ name: 'textboxP1-1', label: 'Legal name', role_name: 'Recipient 1' }),
      }));
    });

    await waitFor(() => {
      expect(onTemplateUpdated).toHaveBeenCalledWith(expect.objectContaining({ event: 'updated-field' }));
    });
    expect(screen.queryByText('Textbox Settings')).not.toBeInTheDocument();
  });

  it('deletes a field from the properties panel', async () => {
    const user = userEvent.setup();
    const onTemplateUpdated = vi.fn();
    const calls = renderFields(makeTemplate(), { onTemplateUpdated });

    await user.click(await screen.findByRole('button', { name: 'signatureP1-1 settings' }));
    expect(await screen.findByText('Signature Settings')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete field' }));

    await waitFor(() => {
      expect(calls).toContainEqual(expect.objectContaining({ method: 'delete', url: '/v2/fields/tpl-1/signatureP1-1' }));
    });

    await waitFor(() => {
      expect(onTemplateUpdated).toHaveBeenCalledWith(expect.objectContaining({ event: 'deleted-field' }));
    });

    // The cache invalidation refetches the template, which no longer has the field.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'signatureP1-1 settings' })).not.toBeInTheDocument();
    });
  });

  it('shows the empty state when the template has no documents', async () => {
    const template = makeTemplate();
    template.documents = [];
    template.fields = [];
    renderFields(template);

    expect(await screen.findByText(/does not have any documents yet/)).toBeInTheDocument();
  });
});
