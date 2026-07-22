import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../controls/Button';
import Dialog from './Dialog';

const meta = {
  title: 'Dialogs/Default',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: 'The base modal panel the other dialogs compose. Render it conditionally; it portals to document.body.',
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogLauncher({ persistent = false }: { persistent?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button label="Open Dialog" onClick={() => setOpen(true)} />
      {open && (
        <Dialog
          heading="Example Dialog"
          persistent={persistent}
          onClose={() => setOpen(false)}
          footer={<Button label="OK" onClick={() => setOpen(false)} />}>
          <p>Dialog body content. Click the overlay, the close button, or OK to dismiss.</p>
        </Dialog>
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <DialogLauncher />,
};

export const Persistent: Story = {
  render: () => <DialogLauncher persistent />,
};
