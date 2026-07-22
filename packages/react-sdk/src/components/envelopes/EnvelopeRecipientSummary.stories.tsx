import { QueryClient } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import EnvelopeRecipientSummary from './EnvelopeRecipientSummary';
import VerdocsProvider from '../../provider/VerdocsProvider';
import { showToast } from '../../utils/toast';

const makeRecipient = (overrides: Partial<IRecipient>): IRecipient =>
  ({
    envelope_id: 'summary-sample',
    role_name: 'Recipient 1',
    status: 'invited',
    first_name: 'Paige',
    last_name: 'Turner',
    email: 'paige.turner@example.com',
    phone: null,
    sequence: 1,
    order: 1,
    type: 'signer',
    ...overrides,
  }) as IRecipient;

const inProgressEnvelope = {
  id: 'summary-sample',
  status: 'in progress',
  profile_id: 'profile-1',
  name: 'Consulting Agreement',
  created_at: '2026-07-01T12:00:00Z',
  updated_at: '2026-07-02T09:30:00Z',
  recipients: [
    makeRecipient({ status: 'signed' }),
    makeRecipient({ role_name: 'Recipient 2', first_name: 'Sy', last_name: 'Ner', email: 'sy.ner@example.com', status: 'invited', sequence: 2 }),
    makeRecipient({ role_name: 'CC 1', first_name: 'Carbon', last_name: 'Copy', email: 'cc@example.com', status: 'pending', sequence: 3, type: 'cc' }),
  ],
} as IEnvelope;

const completedEnvelope = {
  ...inProgressEnvelope,
  id: 'summary-complete',
  status: 'complete',
  recipients: [
    makeRecipient({ envelope_id: 'summary-complete', status: 'submitted' }),
    makeRecipient({ envelope_id: 'summary-complete', role_name: 'Recipient 2', first_name: 'Sy', last_name: 'Ner', email: 'sy.ner@example.com', status: 'submitted', sequence: 2 }),
  ],
} as IEnvelope;

// The component self-fetches by envelopeId, exactly like the legacy version, so
// the stories seed the query cache with inline sample envelopes instead of
// hitting the API. staleTime Infinity keeps the samples from being refetched.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
queryClient.setQueryData(['envelopes', inProgressEnvelope.id], inProgressEnvelope);
queryClient.setQueryData(['envelopes', completedEnvelope.id], completedEnvelope);

const meta = {
  title: 'Envelopes/Recipient Summary',
  component: EnvelopeRecipientSummary,
  parameters: {
    docs: {
      description: {
        component:
          'Rendered from inline sample envelopes seeded into the query cache; no session is required. '
          + 'The Get Link button issues a real API request, which fails for these sample envelope IDs '
          + 'and reports through onSdkError, so use it here to see the error path.',
      },
    },
  },
  args: {
    onAnother: () => showToast('Send Another clicked', { style: 'info' }),
    onView: () => showToast('View Now clicked', { style: 'info' }),
    onDone: () => showToast('Done clicked', { style: 'info' }),
    onSdkError: error => showToast(`SDK error: ${error.message}`, { style: 'error' }),
  },
  render: args => (
    <VerdocsProvider baseUrl="https://stage-api.verdocs.com" queryClient={queryClient}>
      <EnvelopeRecipientSummary {...args} />
    </VerdocsProvider>
  ),
} satisfies Meta<typeof EnvelopeRecipientSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  args: {
    envelopeId: 'summary-sample',
  },
};

export const Completed: Story = {
  args: {
    envelopeId: 'summary-complete',
  },
};

export const WithoutWorkflowButtons: Story = {
  args: {
    envelopeId: 'summary-sample',
    canSendAnother: false,
    canView: false,
    canDone: false,
  },
};
