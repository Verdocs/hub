import type { IOrganization } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import OrganizationCard from './OrganizationCard';

const baseOrganization: IOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  address: null,
  address2: null,
  phone: null,
  contact_email: null,
  url: 'https://example.com',
  thumbnail_url: null,
  parent_id: null,
  deletion_protected: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('OrganizationCard', () => {
  it('renders the logo, name, and web site link', () => {
    render(
      <OrganizationCard organization={{ ...baseOrganization, thumbnail_url: 'https://example.com/thumb.png' }} />,
    );

    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute('src', 'https://example.com/thumb.png');
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute('href', 'https://example.com');
  });

  it('falls back to a placeholder icon when there is no logo', () => {
    const { container } = render(<OrganizationCard organization={baseOrganization} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });

  it('omits the web site link when the organization has no url', () => {
    render(<OrganizationCard organization={{ ...baseOrganization, url: null }} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });
});
