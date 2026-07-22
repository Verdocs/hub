import type { IOrganization } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import OrganizationCard from './OrganizationCard';

// A green rounded square, inlined so the story renders without network access.
const SampleLogo =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="%2355bc81"/></svg>';

const SampleOrganization: IOrganization = {
  id: '2f1b6a52-8c5a-4d3e-9d6d-6f5a4b3c2d1e',
  name: 'Acme Document Co',
  address: '123 Main St',
  address2: null,
  phone: null,
  contact_email: 'ops@acme.example.com',
  url: 'https://acme.example.com',
  thumbnail_url: SampleLogo,
  parent_id: null,
  deletion_protected: true,
  created_at: '2024-03-15T12:00:00Z',
  updated_at: '2026-06-01T12:00:00Z',
};

const meta = {
  title: 'Controls/Organization Card',
  component: OrganizationCard,
  args: {
    organization: SampleOrganization,
  },
} satisfies Meta<typeof OrganizationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const MissingLogo: Story = {
  args: {
    organization: { ...SampleOrganization, thumbnail_url: null },
  },
};

export const NameOnly: Story = {
  args: {
    organization: { ...SampleOrganization, thumbnail_url: null, url: null },
  },
};
