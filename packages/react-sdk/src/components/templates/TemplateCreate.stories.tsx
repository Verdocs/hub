import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useSession } from '../../hooks/useSession';
import { showToast } from '../../utils/toast';
import TemplateCreate from './TemplateCreate';

const meta = {
  title: 'Templates/Create',
  component: TemplateCreate,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the Storybook environment. ' +
          'Submitting the form creates a REAL template on the demo account, so clean up afterwards. ' +
          'If you see the sign-in hint, run Embeds/VerdocsAuth first and log in.',
      },
    },
  },
} satisfies Meta<typeof TemplateCreate>;

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

export const LiveCreate: Story = {
  args: {
    onTemplateCreated: template => showToast(`Created template: ${template.name}`, { style: 'success' }),
    onSdkError: error => showToast(`Error: ${error.message}`, { style: 'error' }),
    onCancel: () => showToast('Cancelled', { style: 'info' }),
  },
  render: args => (
    <RequireSession>
      <TemplateCreate {...args} />
    </RequireSession>
  ),
};
