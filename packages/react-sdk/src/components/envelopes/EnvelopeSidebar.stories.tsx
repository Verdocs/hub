import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { EnvelopeSidebarProps } from './EnvelopeSidebar';
import { useEnvelopes } from '../../hooks/useEnvelopes';
import { useSession } from '../../hooks/useSession';
import EnvelopeSidebar from './EnvelopeSidebar';
import { showToast } from '../../utils/toast';

const meta = {
  title: 'Envelopes/Envelope Sidebar',
  component: EnvelopeSidebar,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the VerdocsAuth story, showing the '
          + 'first envelope in the account. If the account has no envelopes, the story says so instead: '
          + 'send one from a template and revisit. CAUTION: owner actions here are real. Sending '
          + 'reminders, re-inviting or updating recipients, changing reminder settings, and canceling '
          + 'all mutate that envelope in the demo account.',
      },
    },
  },
} satisfies Meta<typeof EnvelopeSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

function RequireSession({ children }: { children: ReactNode }) {
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

function FirstEnvelopeSidebar(props: EnvelopeSidebarProps) {
  const query = useEnvelopes({ rows: 1 });

  if (query.isPending) {
    return (
      <div>
        Loading envelopes...
      </div>
    );
  }

  const envelope = query.data?.envelopes?.[0];
  if (!envelope) {
    return (
      <div style={{ fontFamily: 'var(--vdocs-font-sans)', padding: 20 }}>
        This account has no envelopes yet, so there is nothing to show. Send an envelope from a template, then revisit this story.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 500, justifyContent: 'flex-end' }}>
      <EnvelopeSidebar {...props} envelopeId={envelope.id} />
    </div>
  );
}

export const LiveSidebar: Story = {
  args: {
    envelopeId: '',
    onToggle: open => showToast(`Sidebar ${open ? 'opened' : 'closed'}`, { style: 'info' }),
    onEnvelopeUpdated: ({ event }) => showToast(`Envelope updated: ${event}`, { style: 'info' }),
    onGetInPersonLink: ({ recipient }) => showToast(`Get in-person link for: ${recipient.role_name}`, { style: 'info' }),
    onSdkError: error => showToast(`SDK error: ${error.message}`, { style: 'error' }),
  },
  render: args => (
    <RequireSession>
      <FirstEnvelopeSidebar {...args} />
    </RequireSession>
  ),
};
