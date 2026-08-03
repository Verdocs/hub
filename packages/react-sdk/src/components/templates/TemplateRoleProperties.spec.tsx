import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import type { IRole, ITemplate, ITemplateField } from '@verdocs/js-sdk';
import { deleteTemplateRole, getTemplate, updateTemplateRole } from '@verdocs/js-sdk';
import TemplateRoleProperties from './TemplateRoleProperties';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getTemplate: vi.fn(),
    updateTemplateRole: vi.fn(),
    deleteTemplateRole: vi.fn(),
  };
});

const sampleRole: IRole = {
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
};

const makeTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'template-1',
    name: 'Lease Agreement',
    roles: [sampleRole],
    fields: [],
    documents: [],
    ...overrides,
  }) as ITemplate;

const renderPanel = (props = {}) =>
  render(
    <VerdocsProvider baseUrl={TEST_API_BASE}>
      <TemplateRoleProperties templateId="template-1" role={sampleRole} {...props} />
    </VerdocsProvider>,
  );

describe('TemplateRoleProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders the role values with Save disabled until edited', () => {
    renderPanel();

    expect(screen.getByLabelText(/Role Name/)).toHaveValue('Recipient 1');
    expect(screen.getByLabelText(/Type/)).toHaveValue('signer');
    expect(screen.getByLabelText(/Sequence/)).toHaveValue(1);
    expect(screen.getByRole('checkbox', { name: 'May Delegate' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves edits through updateTemplateRole and closes', async () => {
    vi.mocked(updateTemplateRole).mockResolvedValue({ ...sampleRole, first_name: 'Jane' });
    const onClose = vi.fn();

    renderPanel({ onClose });

    await userEvent.type(screen.getByLabelText('First Name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email Address'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(vi.mocked(updateTemplateRole)).toHaveBeenCalledWith(expect.anything(), 'template-1', 'Recipient 1', {
        name: 'Recipient 1',
        type: 'signer',
        sequence: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '',
        delegator: false,
      });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('blocks saving while contact info is incomplete, and locks deletion while dirty', async () => {
    renderPanel();

    await userEvent.type(screen.getByLabelText('First Name'), 'Jane');

    // First name alone is neither "all blank" nor "complete", so Save stays off.
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    // Deleting with unsaved edits is blocked, matching the legacy behavior.
    expect(screen.getByRole('button', { name: 'Delete Role' })).toBeDisabled();
  });

  it('deletes the role after confirmation', async () => {
    vi.mocked(deleteTemplateRole).mockResolvedValue('');
    const onDelete = vi.fn();
    const onClose = vi.fn();

    renderPanel({ onDelete, onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Delete Role' }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(vi.mocked(deleteTemplateRole)).toHaveBeenCalledWith(expect.anything(), 'template-1', 'Recipient 1');
    });

    expect(onDelete).toHaveBeenCalledWith({ templateId: 'template-1', roleName: 'Recipient 1' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not delete when the confirmation is declined', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const onDelete = vi.fn();

    renderPanel({ onDelete });

    await userEvent.click(screen.getByRole('button', { name: 'Delete Role' }));

    expect(vi.mocked(deleteTemplateRole)).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('locks the name once fields reference the role', async () => {
    vi.mocked(getTemplate).mockResolvedValue(makeTemplate({ fields: [{ role_name: 'Recipient 1' } as ITemplateField] }));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByLabelText(/Role Name/)).toBeDisabled();
    });
    expect(screen.getByText(/can no longer be renamed/)).toBeInTheDocument();
  });
});
