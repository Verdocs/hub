import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerdocsTemplatesList } from './VerdocsTemplatesList';
import { useSession } from '../../hooks/useSession';
import { showToast } from '../../utils/toast';

const meta = {
  title: 'Embeds/VerdocsTemplatesList',
  component: VerdocsTemplatesList,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the VerdocsAuth story. ' +
          'If you see the sign-in hint, run Embeds/VerdocsAuth first and log in.',
      },
    },
  },
} satisfies Meta<typeof VerdocsTemplatesList>;

export default meta;
type Story = StoryObj<typeof meta>;

const RequireSession = ({ children }: { children: React.ReactNode }) => {
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
};

export const LiveList: Story = {
  args: {
    onViewTemplate: ({ template }) => showToast(`View template: ${template.name}`, { style: 'info' }),
    onSubmittedData: ({ template }) => showToast(`Submissions for: ${template.name}`, { style: 'info' }),
    onEditTemplate: ({ template }) => showToast(`Edit template: ${template.name}`, { style: 'info' }),
  },
  render: args => (
    <RequireSession>
      <VerdocsTemplatesList {...args} />
    </RequireSession>
  ),
};
