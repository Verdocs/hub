import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../controls/Button';
import OtpDialog from './OtpDialog';

const meta = {
  title: 'Dialogs/OTP Dialog',
  component: OtpDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Collects the one-time code sent to the signer via email or SMS. The resend button unlocks 30 seconds after opening, resending, or submitting.',
      },
    },
  },
} satisfies Meta<typeof OtpDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function OtpLauncher({ error }: { error?: string }) {
  const [open, setOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState('');

  return (
    <>
      <Button label="Open OTP Dialog" onClick={() => setOpen(true)} />
      {open && (
        <OtpDialog
          error={error}
          onSubmit={code => setLastEvent(`Submitted: ${code}`)}
          onResend={() => setLastEvent('Resend requested')}
          onCancel={() => setOpen(false)}
        />
      )}
      {lastEvent && (
        <p>
          {lastEvent}
        </p>
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <OtpLauncher />,
};

export const WithError: Story = {
  render: () => <OtpLauncher error="Invalid verification code. Please try again." />,
};
