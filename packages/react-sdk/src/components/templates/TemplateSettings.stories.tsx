import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTemplates } from '../../hooks/useTemplates';
import { useSession } from '../../hooks/useSession';
import TemplateSettings from './TemplateSettings';
import { showToast } from '../../utils/toast';

const meta = {
  title: 'Templates/Settings',
  component: TemplateSettings,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the VerdocsAuth story, editing the ' +
          'first template in the account. Saving really updates that template; the demo account is ' +
          'expected to accumulate junk edits. If you see the sign-in hint, run Embeds/VerdocsAuth first.',
      },
    },
  },
} satisfies Meta<typeof TemplateSettings>;

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

export const LiveSettings: Story = {
  args: {
    // The wrapper substitutes the first template from the live account.
    templateId: '',
    onSettingsChanged: ({ template }) => showToast(`Settings saved: ${template.name}`, { style: 'success' }),
    onCancel: () => showToast('Cancelled', { style: 'info' }),
    onSdkError: error => showToast(`SDK error: ${error.message}`, { style: 'error' }),
  },
  render: args => (
    <LiveTemplate>
      {templateId => <TemplateSettings {...args} templateId={templateId} />}
    </LiveTemplate>
  ),
};
