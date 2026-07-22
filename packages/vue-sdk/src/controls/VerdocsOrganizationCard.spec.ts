import { mount } from '@vue/test-utils';
import type { IOrganization } from '@verdocs/js-sdk';
import VerdocsOrganizationCard from './VerdocsOrganizationCard.vue';

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

describe('VerdocsOrganizationCard', () => {
  it('renders the logo, name, and web site link', () => {
    const wrapper = mount(VerdocsOrganizationCard, {
      props: { organization: { ...baseOrganization, thumbnail_url: 'https://example.com/thumb.png' } },
    });

    expect(wrapper.get('img[alt="Logo"]').attributes('src')).toBe('https://example.com/thumb.png');
    expect(wrapper.text()).toContain('Test Organization');
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com');
    expect(wrapper.get('a').text()).toBe('https://example.com');
  });

  it('falls back to a placeholder icon when there is no logo', () => {
    const wrapper = mount(VerdocsOrganizationCard, { props: { organization: baseOrganization } });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Organization');
  });

  it('omits the web site link when the organization has no url', () => {
    const wrapper = mount(VerdocsOrganizationCard, { props: { organization: { ...baseOrganization, url: null } } });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain('Test Organization');
  });
});
