import type { ReactNode } from 'react';
import type { IRecipient } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import ContactPicker, { type TPickerContact } from './ContactPicker';
import { showToast } from '../../utils/toast';

const sampleRole: Partial<IRecipient> = {
  role_name: 'Recipient 1',
  type: 'signer',
  sequence: 1,
  order: 1,
};

const sampleSuggestions: TPickerContact[] = [
  {
    id: '6ad3ffe4-1e0f-4f6b-9be9-91e6f10b4cbf',
    first_name: 'Paige',
    last_name: 'Turner',
    email: 'paige.turner@example.com',
    phone: '+12025551212',
  },
  {
    id: 'e5f0f4b8-7c86-40f1-9d09-8b3f77dfd83a',
    first_name: 'Perry',
    last_name: 'Legal',
    email: 'perry.legal@example.com',
  },
  {
    id: '9b7bc38a-4b2e-4a83-bf14-13c521c72e63',
    first_name: 'Sue',
    last_name: 'Permann',
    email: 'sue.permann@example.com',
    phone: '+12025551313',
  },
];

// The picker no longer carries card chrome, so the stories supply the surface a host such as
// VerdocsSend would provide.
function HostCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`vdocs:box-border vdocs:flex vdocs:w-[300px] vdocs:flex-col vdocs:rounded-lg vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:p-3 vdocs:shadow-[0_0_15px_0_rgba(0,0,0,0.1)] ${className}`}>
      {children}
    </div>
  );
}

const meta = {
  title: 'Envelopes/Contact Picker',
  component: ContactPicker,
  args: {
    templateRole: sampleRole,
    suggestions: sampleSuggestions,
    availableAuthMethods: [ 'passcode', 'email', 'sms' ],
    onSearchContacts: query => console.log('[ContactPicker] searchContacts', query),
    onSubmit: contact => showToast(`Recipient: ${contact.first_name} ${contact.last_name} <${contact.email}>`, { style: 'success' }),
    onCancel: () => showToast('Cancelled', { style: 'info' }),
  },
  render: args => (
    <HostCard>
      <ContactPicker {...args} />
    </HostCard>
  ),
} satisfies Meta<typeof ContactPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Focus a name field to see the suggestions; the console logs each search query. */
export const Empty: Story = {};

export const PrefilledRole: Story = {
  args: {
    templateRole: {
      ...sampleRole,
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      phone: '+12025551212',
      message: 'Please sign at your earliest convenience.',
      delegator: true,
    },
  },
};

/** KBA and ID check are locked here, the way an account without those entitlements sees them. */
export const LockedVerificationMethods: Story = {};

export const AllVerificationMethods: Story = {
  args: {
    availableAuthMethods: [ 'passcode', 'email', 'sms', 'kba', 'id' ],
    templateRole: {
      ...sampleRole,
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      auth_methods: [ 'passcode' ],
      passcode: '1234',
    },
  },
};

export const NoSuggestions: Story = {
  args: { suggestions: [] },
};

/**
 * Inside a host that fixes the height: the fields scroll, a fade marks the content below the
 * fold, and Done stays pinned to the bottom. The host provides its own way back, so Cancel is
 * turned off.
 */
export const HeightConstrained: Story = {
  args: {
    showCancel: false,
    availableAuthMethods: [ 'passcode', 'email', 'sms', 'kba' ],
    templateRole: {
      ...sampleRole,
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      auth_methods: [ 'passcode' ],
      passcode: '1234',
    },
  },
  render: args => (
    <HostCard className="vdocs:h-[480px]">
      <ContactPicker {...args} />
    </HostCard>
  ),
};
