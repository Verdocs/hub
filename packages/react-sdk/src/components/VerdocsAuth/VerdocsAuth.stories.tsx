import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerdocsAuth } from './VerdocsAuth';

const meta = {
  title: 'Embeds/VerdocsAuth',
  component: VerdocsAuth,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API. Log in here and the session persists for the ' +
          'VerdocsTemplatesList story. Use a beta test account; the signup flow creates real accounts.',
      },
    },
  },
} satisfies Meta<typeof VerdocsAuth>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveLogin: Story = {
  args: {
    onAuthenticated: status => console.log('[story] Authenticated', status),
    onSdkError: error => console.log('[story] SDK error', error),
  },
};

export const ForgotPassword: Story = {
  args: { initialMode: 'forgot' },
};

export const Signup: Story = {
  args: { initialMode: 'signup' },
};
