import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { IOrganization, ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import TemplateCard from './TemplateCard';

const sampleTemplate = {
  id: 't-1',
  name: 'Onboarding Packet',
  counter: 12,
  star_counter: 4,
  organization: { id: 'o-1', name: 'Acme Document Co' } as IOrganization,
  documents: [{ id: 'd-1', pages: 3 } as ITemplateDocument],
} as ITemplate;

describe('TemplateCard', () => {
  it('renders the name, organization, and counts', () => {
    render(<TemplateCard template={sampleTemplate} />);

    expect(screen.getByText('Onboarding Packet')).toBeInTheDocument();
    expect(screen.getByText('Acme Document Co')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('falls back to Public and one page when relations are missing', () => {
    render(<TemplateCard template={{ ...sampleTemplate, organization: undefined, documents: undefined }} />);

    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('fires onClick with the template when the card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TemplateCard template={sampleTemplate} onClick={onClick} />);

    await user.click(screen.getByText('Onboarding Packet'));

    expect(onClick).toHaveBeenCalledWith(sampleTemplate);
  });
});
