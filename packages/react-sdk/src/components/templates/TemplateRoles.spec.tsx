import userEvent from '@testing-library/user-event';
import type { IRole, ITemplate } from '@verdocs/js-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { createTemplateRole, deleteTemplateRole, getTemplate } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';
import TemplateRoles from './TemplateRoles';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getTemplate: vi.fn(),
    createTemplateRole: vi.fn(),
    deleteTemplateRole: vi.fn(),
  };
});

const makeRole = (overrides: Partial<IRole>): IRole => ({
  template_id: 'template-1',
  name: 'Recipient 1',
  type: 'signer',
  full_name: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  message: null,
  sequence: 1,
  order: 1,
  delegator: false,
  name_locked: false,
  ...overrides,
});

const roles = [
  makeRole({ name: 'Recipient 1', sequence: 1, order: 1 }),
  makeRole({ name: 'Landlord', sequence: 2, order: 1, first_name: 'Larry', last_name: 'Landlord', email: 'larry@example.com' }),
];

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    roles,
    fields: [],
    documents: [],
    ...overrides,
  }) as ITemplate;

const renderRoles = (props = {}) =>
  render(
    <VerdocsProvider baseUrl={TEST_API_BASE}>
      <TemplateRoles templateId="template-1" {...props} />
    </VerdocsProvider>,
  );

describe('TemplateRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders role chips grouped by sequence', async () => {
    renderRoles();

    // Placeholder roles show their role name; known roles show the person.
    expect(await screen.findByText('Recipient 1')).toBeInTheDocument();
    expect(screen.getByText('Larry Landlord')).toBeInTheDocument();

    // Two sequence rows plus the trailing add-a-step row.
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('3.')).toBeInTheDocument();
  });

  it('adds a role with a generated name at the row sequence', async () => {
    vi.mocked(createTemplateRole).mockResolvedValue(makeRole({ name: 'Recipient 3', sequence: 1, order: 2 }));
    const onRolesUpdated = vi.fn();

    renderRoles({ onRolesUpdated });

    await screen.findByText('Recipient 1');
    const addButtons = screen.getAllByRole('button', { name: '+ Add Role' });
    await userEvent.click(addButtons[0]!);

    await waitFor(() => {
      expect(vi.mocked(createTemplateRole)).toHaveBeenCalledWith(
        expect.anything(),
        'template-1',
        expect.objectContaining({ name: 'Recipient 3', sequence: 1, order: 2, type: 'signer' }),
      );
    });

    await waitFor(() => {
      expect(onRolesUpdated).toHaveBeenCalledWith(expect.objectContaining({ event: 'added', templateId: 'template-1' }));
    });
  });

  it('opens the role editor from a chip', async () => {
    renderRoles();

    await screen.findByText('Recipient 1');
    await userEvent.click(screen.getByRole('button', { name: 'Edit role Recipient 1' }));

    expect(screen.getByLabelText(/Role Name/)).toHaveValue('Recipient 1');
  });

  it('deletes a role through the editor and reports it', async () => {
    vi.mocked(deleteTemplateRole).mockResolvedValue('');
    const onRolesUpdated = vi.fn();

    renderRoles({ onRolesUpdated });

    await screen.findByText('Recipient 1');
    await userEvent.click(screen.getByRole('button', { name: 'Edit role Recipient 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Role' }));

    await waitFor(() => {
      expect(vi.mocked(deleteTemplateRole)).toHaveBeenCalledWith(expect.anything(), 'template-1', 'Recipient 1');
    });

    await waitFor(() => {
      expect(onRolesUpdated).toHaveBeenCalledWith(expect.objectContaining({ event: 'deleted' }));
    });

    // The editor panel closes with the deletion.
    expect(screen.queryByLabelText(/Role Name/)).not.toBeInTheDocument();
  });

  it('shows the empty state and disables OK when there are no roles', async () => {
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ roles: [] }));

    renderRoles();

    expect(await screen.findByText(/You must add at least one Role/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
    expect(screen.getByText('1.')).toBeInTheDocument();
  });
});
