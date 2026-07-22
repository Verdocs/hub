import type { Meta, StoryObj } from '@storybook/react-vite';
import VerdocsEnvelopesList from './VerdocsEnvelopesList';
import { useSession } from '../../hooks/useSession';
import { showToast } from '../../utils/toast';

const meta = {
  title: 'Envelopes/Envelopes List',
  component: VerdocsEnvelopesList,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the VerdocsAuth story. ' +
          'If you see the sign-in hint, run Embeds/VerdocsAuth first and log in.',
      },
    },
  },
} satisfies Meta<typeof VerdocsEnvelopesList>;

export default meta;
type Story = StoryObj<typeof meta>;

function RequireSession({ children }: { children: React.ReactNode }) {
  const { loaded, authenticated } = useSession();

  if (!loaded) {
    return (
      <div>
        Checking session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ fontFamily: 'var(--vdocs-font-sans)', padding: 20 }}>
        No active session. Open the Embeds/VerdocsAuth story, log in with your beta test account, then return here.
      </div>
    );
  }

  return children;
}

export const LiveList: Story = {
  args: {
    view: 'all',
    onViewEnvelope: ({ envelope }) => showToast(`View envelope: ${envelope.name}`, { style: 'info' }),
    onDownload: ({ envelope }) => showToast(`Download envelope: ${envelope.name}`, { style: 'info' }),
    onCancelEnvelope: ({ envelope }) => showToast(`Cancel envelope: ${envelope.name}`, { style: 'info' }),
  },
  render: args => (
    <RequireSession>
      <VerdocsEnvelopesList {...args} />
    </RequireSession>
  ),
};
