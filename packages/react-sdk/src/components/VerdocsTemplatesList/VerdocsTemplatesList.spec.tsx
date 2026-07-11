import type { ITemplate } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { canPerformTemplateAction, getTemplates } from '@verdocs/js-sdk';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { toggleTemplateStar } from '../../api/templateStar';
import VerdocsTemplatesList from './VerdocsTemplatesList';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    getTemplates: vi.fn(),
    canPerformTemplateAction: vi.fn(),
  };
});

vi.mock('../../api/templateStar', () => ({
  toggleTemplateStar: vi.fn(),
}));

const makeTemplate = (overrides: Partial<ITemplate>): ITemplate =>
  ({
    id: 'template-1',
    name: 'Test Template',
    counter: 3,
    star_counter: 0,
    is_personal: false,
    is_public: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    last_used_at: '2026-03-01T00:00:00Z',
    ...overrides,
  }) as ITemplate;

const templates = [
  makeTemplate({ id: 't-1', name: 'Onboarding Packet', star_counter: 1 }),
  makeTemplate({ id: 't-2', name: 'Sales Agreement' }),
];

const renderList = (props = {}) =>
  render(
    <VerdocsProvider baseUrl="https://stage-api.verdocs.com">
      <VerdocsTemplatesList {...props} />
    </VerdocsProvider>,
  );

describe('VerdocsTemplatesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(canPerformTemplateAction).mockReturnValue({ canPerform: true, message: '' });
    vi.mocked(getTemplates).mockResolvedValue({ count: 2, rows: 2, page: 0, templates });
  });

  it('renders a row per template', async () => {
    renderList();

    expect(await screen.findByText('Onboarding Packet')).toBeInTheDocument();
    expect(screen.getByText('Sales Agreement')).toBeInTheDocument();

    expect(vi.mocked(getTemplates)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ visibility: 'private_shared', sort_by: 'updated_at', page: 0, rows: 10 }),
    );
  });

  it('fires onViewTemplate when a row is clicked', async () => {
    const onViewTemplate = vi.fn();
    renderList({ onViewTemplate });

    await userEvent.click(await screen.findByText('Onboarding Packet'));

    expect(onViewTemplate).toHaveBeenCalledWith(expect.objectContaining({ template: templates[0] }));
  });

  it('filters locally while typing', async () => {
    renderList();

    await screen.findByText('Onboarding Packet');
    await userEvent.type(screen.getByPlaceholderText('Filter by Name...'), 'Sales');

    expect(screen.queryByText('Onboarding Packet')).not.toBeInTheDocument();
    expect(screen.getByText('Sales Agreement')).toBeInTheDocument();
  });

  it('requeries with is_starred when the starred filter changes', async () => {
    renderList();

    await screen.findByText('Onboarding Packet');
    await userEvent.click(screen.getByRole('button', { name: /Starred.*All/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Starred' }));

    await waitFor(() => {
      expect(vi.mocked(getTemplates)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ is_starred: true }),
      );
    });
  });

  it('toggles stars through the mutation', async () => {
    vi.mocked(toggleTemplateStar).mockResolvedValue(makeTemplate({ id: 't-2', star_counter: 1 }));

    renderList();

    await screen.findByText('Sales Agreement');
    const starButtons = screen.getAllByRole('button', { name: 'Star template' });
    await userEvent.click(starButtons[0]!);

    await waitFor(() => {
      expect(vi.mocked(toggleTemplateStar)).toHaveBeenCalledWith(expect.anything(), 't-2');
    });
  });

  it('offers Sign Now as a disabled menu item', async () => {
    renderList();

    await screen.findByText('Onboarding Packet');
    const menuButtons = screen.getAllByRole('button', { name: 'Open menu' });
    await userEvent.click(menuButtons[0]!);

    expect(screen.getByRole('menuitem', { name: 'Sign Now' })).toBeDisabled();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows the empty state when no templates match', async () => {
    vi.mocked(getTemplates).mockResolvedValue({ count: 0, rows: 0, page: 0, templates: [] });

    renderList();

    expect(await screen.findByText(/No matching templates found/)).toBeInTheDocument();
  });
});
