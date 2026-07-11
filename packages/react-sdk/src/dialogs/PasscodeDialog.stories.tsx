import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import PasscodeDialog from './PasscodeDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Passcode Dialog',
  component: PasscodeDialog,
  parameters: {
    docs: {
      description: {
        component: 'Collects the passcode protecting an envelope before the signing session can proceed.',
      },
    },
  },
} satisfies Meta<typeof PasscodeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function PasscodeLauncher({ error }: { error?: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState('');

  return (
    <>
      <Button label="Open Passcode Dialog" onClick={() => setOpen(true)} />
      {open && (
        <PasscodeDialog
          error={error}
          onSubmit={code => setSubmitted(`Submitted: ${code}`)}
          onCancel={() => setOpen(false)}
        />
      )}
      {submitted && (
        <p>
          {submitted}
        </p>
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <PasscodeLauncher />,
};

export const WithError: Story = {
  render: () => <PasscodeLauncher error="Invalid passcode. Please try again." />,
};
