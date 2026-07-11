import type { IRecipient } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import EnvelopeRecipientLink from './EnvelopeRecipientLink';
import { showToast } from '../../utils/toast';

const recipient = {
  envelope_id: '11111111-2222-3333-4444-555555555555',
  role_name: 'Signer 1',
  first_name: 'Paige',
  last_name: 'Turner',
  email: 'paige.turner@example.com',
  sequence: 1,
  status: 'invited',
} as IRecipient;

const meta = {
  title: 'Envelopes/Recipient Link',
  component: EnvelopeRecipientLink,
  args: {
    recipient,
    onGetLink: r => showToast(`Get link for: ${r.role_name}`, { style: 'info' }),
    onDone: () => showToast('Done clicked', { style: 'info' }),
  },
} satisfies Meta<typeof EnvelopeRecipientLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutLink: Story = {
  args: {},
};

export const FetchingLink: Story = {
  args: { gettingLink: true },
};

export const WithLink: Story = {
  args: {
    link: 'https://app.verdocs.com/envelopes/11111111-2222-3333-4444-555555555555/sign/in-person/abcdef123456',
  },
};
