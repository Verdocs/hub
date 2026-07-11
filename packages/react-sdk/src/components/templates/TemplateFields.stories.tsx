import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTemplates } from '../../hooks/useTemplates';
import { useSession } from '../../hooks/useSession';
import { showToast } from '../../utils/toast';
import TemplateFields from './TemplateFields';

const meta = {
  title: 'Templates/Fields',
  component: TemplateFields,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API using the session from the VerdocsAuth story: it lists '
          + 'your templates and renders the first one that has fields (or the first template at all '
          + 'if none do, which shows pages without fields). If you see the sign-in hint, run '
          + 'Embeds/VerdocsAuth first and log in. Saving or deleting from the settings panel '
          + 'changes real data in the account.',
      },
    },
  },
} satisfies Meta<typeof TemplateFields>;

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

function FirstTemplateWithFields() {
  const query = useTemplates();
  const templates = query.data?.templates ?? [];
  const chosen = templates.find(template => (template.fields?.length ?? 0) > 0) ?? templates[0];

  if (query.isPending) {
    return (
      <div>
        Loading templates...
      </div>
    );
  }

  if (!chosen) {
    return (
      <div>
        No templates found in this account. Create one first, then return here.
      </div>
    );
  }

  return (
    <TemplateFields
      templateId={chosen.id}
      onTemplateUpdated={({ event }) => showToast(`Template updated: ${event}`, { style: 'info' })}
      onSdkError={error => showToast(error.message, { style: 'error' })}
    />
  );
}

export const LiveFields: Story = {
  args: { templateId: '' },
  render: () => (
    <RequireSession>
      <FirstTemplateWithFields />
    </RequireSession>
  ),
};
