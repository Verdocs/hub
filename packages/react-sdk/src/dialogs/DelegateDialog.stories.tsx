import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import DelegateDialog from './DelegateDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Delegate Dialog',
  component: DelegateDialog,
  parameters: {
    docs: {
      description: {
        component: 'Collects the new recipient details when a signer delegates signing responsibility to someone else.',
      },
    },
  },
} satisfies Meta<typeof DelegateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DelegateLauncher() {
  const [open, setOpen] = useState(false);
  const [delegated, setDelegated] = useState('');

  return (
    <>
      <Button label="Open Delegate Dialog" onClick={() => setOpen(true)} />
      {open && (
        <DelegateDialog
          onDelegate={(details) => {
            setDelegated(`Delegated to ${details.first_name} ${details.last_name} <${details.email}>`);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
      {delegated && (
        <p>
          {delegated}
        </p>
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <DelegateLauncher />,
};
