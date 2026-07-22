import type { IRole } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import TemplateRoleProperties from './TemplateRoleProperties';
import { showToast } from '../../utils/toast';

const meta = {
  title: 'Templates/Role Properties',
  component: TemplateRoleProperties,
  parameters: {
    docs: {
      description: {
        component:
          'Renders standalone from inline sample role data, with callbacks surfaced as toasts. There ' +
          'is no real template behind it, so Save and Delete will hit the API and fail (watch for the ' +
          'onSdkError toast); use the Templates/Roles story to exercise the full round trip.',
      },
    },
  },
} satisfies Meta<typeof TemplateRoleProperties>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseRole: IRole = {
  template_id: '',
  name: 'Recipient 1',
  type: 'signer',
  full_name: null,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  message: null,
  sequence: 1,
  order: 1,
  delegator: false,
  name_locked: false,
};

const sharedArgs = {
  templateId: '',
  onClose: () => showToast('onClose fired', { style: 'info' }),
  onDelete: ({ roleName }: { templateId: string; roleName: string }) => showToast(`onDelete fired for ${roleName}`, { style: 'info' }),
  onSdkError: (error: Error) => showToast(`onSdkError: ${error.message}`, { style: 'error' }),
};

/** A placeholder role whose contact info gets filled in at send time. */
export const UnknownRole: Story = {
  args: {
    ...sharedArgs,
    role: baseRole,
  },
};

/** A "known" role with contact info stored on the template. */
export const KnownRole: Story = {
  args: {
    ...sharedArgs,
    role: {
      ...baseRole,
      name: 'Leasing Agent',
      type: 'approver',
      first_name: 'Sally',
      last_name: 'Signer',
      email: 'sally@example.com',
      phone: '+15551234567',
      sequence: 2,
    },
  },
};
