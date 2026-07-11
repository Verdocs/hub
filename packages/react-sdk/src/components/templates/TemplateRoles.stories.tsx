import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTemplates } from '../../hooks/useTemplates';
import { useSession } from '../../hooks/useSession';
import { showToast } from '../../utils/toast';
import TemplateRoles from './TemplateRoles';

const meta = {
  title: 'Templates/Roles',
  component: TemplateRoles,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the VerdocsAuth story, editing the ' +
          'first template in the account. Adding, editing, and deleting roles really modifies that ' +
          'template; the demo account is expected to accumulate junk. If you see the sign-in hint, ' +
          'run Embeds/VerdocsAuth first.',
      },
    },
  },
} satisfies Meta<typeof TemplateRoles>;

export default meta;
type Story = StoryObj<typeof meta>;

function LiveTemplate({ children }: { children: (templateId: string) => ReactNode }) {
  const { loaded, authenticated } = useSession();
  const query = useTemplates({ rows: 1, sort_by: 'updated_at' });

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

  if (query.isPending) {
    return (
      <div>
        Loading templates...
      </div>
    );
  }

  const template = query.data?.templates?.[0];
  if (!template) {
    return (
      <div>
        No templates found in this account. Create one first, then return here.
      </div>
    );
  }

  return children(template.id);
}

export const LiveRoles: Story = {
  args: {
    // The wrapper substitutes the first template from the live account.
    templateId: '',
    onRolesUpdated: ({ event, roles }) => showToast(`Roles ${event}: now ${roles.length} role(s)`, { style: 'success' }),
    onNext: () => showToast('OK clicked', { style: 'info' }),
    onCancel: () => showToast('Cancelled', { style: 'info' }),
    onSdkError: error => showToast(`SDK error: ${error.message}`, { style: 'error' }),
  },
  render: args => (
    <LiveTemplate>
      {templateId => <TemplateRoles {...args} templateId={templateId} />}
    </LiveTemplate>
  ),
};
