import axios from 'axios';
import { useEffect, useState } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import VerdocsSend, { type VerdocsSendProps } from './VerdocsSend';

const meta = {
  title: 'Embeds/VerdocsSend',
  component: VerdocsSend,
  parameters: {
    docs: {
      description: {
        component:
          'The send form for a template: a roster of the template roles plus the delivery settings, '
          + 'each row sliding the card across to its detail view. The live story reads a real template from '
          + 'the API, so paste a template id from the account you are logged into. The scripted story below '
          + 'serves canned data instead, so the whole flow can be clicked through without a session.',
      },
    },
  },
} satisfies Meta<typeof VerdocsSend>;

export default meta;
type Story = StoryObj<typeof meta>;

const STORY_ORGANIZATION_ID = 'org-story';
const STORY_TEMPLATE_ID = 'template-story';

// Unsigned, unexpired, and never sent anywhere: the scripted endpoint only needs a decodable token
// so the component sees a session, and every request it makes is answered by the mock adapter.
const storyToken = () => {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'user-story', profile_id: 'profile-story', exp: Math.floor(Date.now() / 1000) + 3600 })}.story`;
};

const storyTemplate = {
  id: STORY_TEMPLATE_ID,
  name: 'Mutual NDA',
  organization_id: STORY_ORGANIZATION_ID,
  is_sendable: true,
  roles: [
    { template_id: STORY_TEMPLATE_ID, name: 'Discloser', type: 'signer', sequence: 1, order: 1, first_name: 'Avery', last_name: 'Quinn', email: 'avery@example.com' },
    { template_id: STORY_TEMPLATE_ID, name: 'Recipient', type: 'signer', sequence: 2, order: 1 },
    { template_id: STORY_TEMPLATE_ID, name: 'Witness', type: 'signer', sequence: 2, order: 2 },
  ],
};

const storyBrands = [
  { id: 'brand-story-1', organization_id: STORY_ORGANIZATION_ID, key: 'acme', name: 'Acme Corp', primary_color: '#1e6fd9' },
  { id: 'brand-story-2', organization_id: STORY_ORGANIZATION_ID, key: 'globex', name: 'Globex', primary_color: '#b8860b' },
];

const storyContacts = [
  { id: 'contact-1', first_name: 'Jordan', last_name: 'Lee', email: 'jordan@example.com', phone: '+12125551212' },
  { id: 'contact-2', first_name: 'Rita', last_name: 'Booke', email: 'rita@example.com' },
];

const oneYear = 365 * 24 * 60 * 60 * 1000;

const storyEntitlements = [
  {
    id: 'ent-1',
    organization_id: STORY_ORGANIZATION_ID,
    feature: 'sms_auth',
    starts_at: new Date(Date.now() - oneYear).toISOString(),
    ends_at: new Date(Date.now() + oneYear).toISOString(),
  },
];

/**
 * Scripted variant: the mock adapter is installed before the endpoint exists, so the endpoint's
 * axios instance inherits it and every call the component makes is answered locally.
 */
function MockedSend(props: Partial<VerdocsSendProps>) {
  const [{ endpoint, mock }] = useState(() => {
    const installed = new MockAdapter(axios);
    installed.onGet('/v2/profiles').reply(200, [{ id: 'profile-story', current: true, first_name: 'Sam', last_name: 'Sender', email: 'sam@example.com' }]);
    installed.onGet(`/v2/templates/${STORY_TEMPLATE_ID}`).reply(200, storyTemplate);
    installed.onGet(`/v2/organizations/${STORY_ORGANIZATION_ID}/brands`).reply(200, storyBrands);
    installed.onGet(`/v2/organizations/${STORY_ORGANIZATION_ID}`).reply(200, { id: STORY_ORGANIZATION_ID, name: 'Acme Corp', default_brand_id: 'brand-story-1' });
    installed.onGet('/v2/organization-contacts').reply(200, storyContacts);
    installed.onGet('/v2/organizations/entitlements').reply(200, storyEntitlements);
    installed.onPost('/v2/envelopes').reply(200, { id: 'envelope-story', name: storyTemplate.name, status: 'pending' });

    const created = new VerdocsEndpoint({ persist: false });
    created.setToken(storyToken());
    return { endpoint: created, mock: installed };
  });

  useEffect(() => () => mock.restore(), [mock]);

  return <VerdocsSend templateId={STORY_TEMPLATE_ID} {...props} endpoint={endpoint} />;
}

export const Live: Story = {
  args: {
    templateId: '',
    onSend: details => console.log('[story] Sent', details),
    onCancel: () => console.log('[story] Cancelled'),
    onSdkError: error => console.log('[story] SDK error', error),
  },
  render: args =>
    (args.templateId
      ? <VerdocsSend {...args} />
      : <p>Set the templateId arg to a sendable template in the logged-in account.</p>),
};

export const Scripted: Story = {
  args: { templateId: STORY_TEMPLATE_ID },
  parameters: {
    docs: {
      description: {
        story:
          'Canned template, brands, contacts, and entitlements. The Discloser is already filled in by the '
          + 'template, the other two roles are open, and SMS verification is entitled so the recipient form '
          + 'offers it. Sending posts to the mock and reports a story envelope id.',
      },
    },
  },
  render: () => (
    <MockedSend
      onSend={details => console.log('[story] Sent', details)}
      onCancel={() => console.log('[story] Cancelled')}
      onSearchContacts={query => console.log('[story] Searching contacts', query)} />
  ),
};
