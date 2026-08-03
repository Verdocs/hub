import { QueryClient } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import EnvelopeUpdateRecipient from './EnvelopeUpdateRecipient';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { TEST_API_BASE } from '../../test/setup';
import { showToast } from '../../utils/toast';

const sampleEnvelope = {
  id: 'update-sample',
  status: 'pending',
  profile_id: 'profile-1',
  name: 'Consulting Agreement',
  created_at: '2026-07-01T12:00:00Z',
  updated_at: '2026-07-02T09:30:00Z',
  recipients: [
    {
      envelope_id: 'update-sample',
      role_name: 'Recipient 1',
      status: 'invited',
      first_name: 'Paige',
      last_name: 'Turner',
      email: 'paige.turner@example.com',
      phone: '+15555550123',
      message: 'Please sign at your earliest convenience.',
      sequence: 1,
      order: 1,
      type: 'signer',
    } as IRecipient,
  ],
} as IEnvelope;

// The component self-fetches by envelopeId, exactly like the legacy version, so
// the story seeds the query cache with an inline sample envelope instead of
// hitting the API. staleTime Infinity keeps the sample from being refetched.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
queryClient.setQueryData(['envelopes', sampleEnvelope.id], sampleEnvelope);

const meta = {
  title: 'Envelopes/Update Recipient',
  component: EnvelopeUpdateRecipient,
  parameters: {
    docs: {
      description: {
        component:
          'Rendered from an inline sample envelope seeded into the query cache; no session is required '
          + 'and callbacks are logged as toasts and console output. Saving a change issues a real PATCH, '
          + 'which fails for this sample envelope ID and reports through onSdkError; against a live '
          + 'envelope the same save emails the recipient a fresh invitation.',
      },
    },
  },
} satisfies Meta<typeof EnvelopeUpdateRecipient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdateRecipient: Story = {
  args: {
    envelopeId: 'update-sample',
    roleName: 'Recipient 1',
    onUpdated: recipient => {
      console.log('onUpdated', recipient);
      showToast(`Recipient updated: ${recipient.first_name} ${recipient.last_name}`, { style: 'success' });
    },
    onCancel: () => {
      console.log('onCancel');
      showToast('Canceled', { style: 'info' });
    },
    onSdkError: error => {
      console.log('onSdkError', error);
      showToast(`SDK error: ${error.message}`, { style: 'error' });
    },
  },
  render: args => (
    <VerdocsProvider baseUrl={TEST_API_BASE} queryClient={queryClient}>
      <EnvelopeUpdateRecipient {...args} />
    </VerdocsProvider>
  ),
};
