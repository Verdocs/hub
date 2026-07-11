import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import InitialDialog, { type InitialDialogProps } from './InitialDialog';
import type { IAdoptedSignature } from './AdoptSignatureDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Initial Dialog',
  component: InitialDialog,
  parameters: {
    docs: {
      description: {
        component:
          'The initials counterpart to SignatureDialog, with initials labels and a half-width preview. '
          + "Persistence via js-sdk createInitials is the caller's job.",
      },
    },
  },
} satisfies Meta<typeof InitialDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function InitialLauncher(args: InitialDialogProps) {
  const [open, setOpen] = useState(false);
  const [adopted, setAdopted] = useState<IAdoptedSignature | null>(null);

  return (
    <>
      <Button label="Initial Document" onClick={() => setOpen(true)} />
      {adopted && (
        <img
          src={adopted.dataUrl}
          alt="Adopted initials"
          className="vdocs:mt-4 vdocs:block vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas"
        />
      )}
      {open && (
        <InitialDialog
          {...args}
          onAdopt={result => {
            setAdopted(result);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}

export const Basic: Story = {
  args: { initials: 'PT' },
  render: args => <InitialLauncher {...args} />,
};
