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
