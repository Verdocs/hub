import type { ITemplate } from '@verdocs/js-sdk';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import TemplateBuildTabs from './TemplateBuildTabs';

const sampleTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    documents: [{ id: 'doc-1' }],
    roles: [{ name: 'Recipient 1' }],
    fields: [{ name: 'textboxP1-1' }],
    ...overrides,
  }) as ITemplate;

describe('TemplateBuildTabs', () => {
  it('renders the four builder steps with the selected one marked', () => {
    render(<TemplateBuildTabs selectedStep="fields" template={sampleTemplate()} />);

    expect(screen.getByRole('tab', { name: 'Attachments' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Workflow' })).toBeEnabled();
    expect(screen.getByRole('tab', { name: 'Fields' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Preview & Send' })).toBeEnabled();
  });

  it('leaves only Attachments enabled without a template', () => {
    render(<TemplateBuildTabs selectedStep="attachments" />);

    expect(screen.getByRole('tab', { name: 'Attachments' })).toBeEnabled();
    expect(screen.getByRole('tab', { name: 'Workflow' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Fields' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Preview & Send' })).toBeDisabled();
  });

  it('unlocks steps as the template gains documents, roles, and fields', () => {
    const { rerender } = render(<TemplateBuildTabs selectedStep="attachments" template={sampleTemplate({ roles: [], fields: [] })} />);

    expect(screen.getByRole('tab', { name: 'Workflow' })).toBeEnabled();
    expect(screen.getByRole('tab', { name: 'Fields' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Preview & Send' })).toBeDisabled();

    rerender(<TemplateBuildTabs selectedStep="attachments" template={sampleTemplate({ fields: [] })} />);

    expect(screen.getByRole('tab', { name: 'Fields' })).toBeEnabled();
    expect(screen.getByRole('tab', { name: 'Preview & Send' })).toBeDisabled();
  });

  it('fires onSelectStep with the step id and ignores disabled steps', async () => {
    const user = userEvent.setup();
    const onSelectStep = vi.fn();
    render(<TemplateBuildTabs selectedStep="attachments" template={sampleTemplate({ fields: [] })} onSelectStep={onSelectStep} />);

    await user.click(screen.getByRole('tab', { name: 'Workflow' }));
    expect(onSelectStep).toHaveBeenCalledWith('roles');

    await user.click(screen.getByRole('tab', { name: 'Preview & Send' }));
    expect(onSelectStep).toHaveBeenCalledTimes(1);
  });
});
