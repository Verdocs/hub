import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../controls/Button';
import OkDialog from './OkDialog';

const meta = {
  title: 'Dialogs/Ok Dialog',
  component: OkDialog,
  parameters: {
    docs: {
      description: {
        component: 'A simple message dialog with an OK button and an optional Cancel button. Render it conditionally and unmount it in onOk/onCancel.',
      },
    },
  },
} satisfies Meta<typeof OkDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function OkDialogLauncher({ showCancel = false, buttonLabel }: { showCancel?: boolean; buttonLabel?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button label="Open Dialog" onClick={() => setOpen(true)} />
      {open && (
        <OkDialog
          heading="You're Done!"
          buttonLabel={buttonLabel}
          showCancel={showCancel}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          message={(
            <p>
              You can access the document at any time by clicking on the link from the
              invitation email. After all recipients have completed their actions, you
              will receive an email with the document and envelope certificate attached.
            </p>
          )}
        />
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <OkDialogLauncher />,
};

export const WithCancel: Story = {
  render: () => <OkDialogLauncher showCancel buttonLabel="Proceed" />,
};
