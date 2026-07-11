import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SignatureDialog, { type SignatureDialogProps } from './SignatureDialog';
import type { IAdoptedSignature } from './AdoptSignatureDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Signature Dialog',
  component: SignatureDialog,
  parameters: {
    docs: {
      description: {
        component:
          'The dialog the signing flow opens when a recipient needs to adopt a signature. '
          + "A thin composition of AdoptSignatureDialog; persistence via js-sdk createSignature is the caller's job.",
      },
    },
  },
} satisfies Meta<typeof SignatureDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function SignatureLauncher(args: SignatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [adopted, setAdopted] = useState<IAdoptedSignature | null>(null);

  return (
    <>
      <Button label="Sign Document" onClick={() => setOpen(true)} />
      {adopted && (
        <img
          src={adopted.dataUrl}
          alt="Adopted signature"
          className="vdocs:mt-4 vdocs:block vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas"
        />
      )}
      {open && (
        <SignatureDialog
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
  args: { fullName: 'Paige Turner' },
  render: args => <SignatureLauncher {...args} />,
};

export const EmptyName: Story = {
  args: {},
  render: args => <SignatureLauncher {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Without a seeded name, the adopt button stays disabled until the recipient types one or draws a signature.',
      },
    },
  },
};
