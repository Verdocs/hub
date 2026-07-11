import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import AdoptSignatureDialog, { type AdoptSignatureDialogProps, type IAdoptedSignature } from './AdoptSignatureDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Adopt Signature Dialog',
  component: AdoptSignatureDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Adopt a signature or initials image by typing a name (rendered in a script font) or drawing on the Draw tab. '
          + "The adopted PNG comes back through onAdopt as a data URL; persisting it via js-sdk is the caller's job.",
      },
    },
  },
} satisfies Meta<typeof AdoptSignatureDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function AdoptLauncher(args: AdoptSignatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [adopted, setAdopted] = useState<IAdoptedSignature | null>(null);

  return (
    <>
      <Button label="Open Dialog" onClick={() => setOpen(true)} />
      {adopted && (
        <div className="vdocs:mt-4 vdocs:font-sans vdocs:text-sm vdocs:text-ink">
          <div>
            {`Adopted (${adopted.type}) for ${adopted.fullName}:`}
          </div>
          <img
            src={adopted.dataUrl}
            alt="Adopted result"
            className="vdocs:mt-2 vdocs:block vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas"
          />
        </div>
      )}
      {open && (
        <AdoptSignatureDialog
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

export const Signature: Story = {
  args: { fullName: 'Paige Turner' },
  render: args => <AdoptLauncher {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'Click through both tabs: Type renders the name in the script font, Draw takes mouse, touch, or stylus strokes with a Clear button.',
      },
    },
  },
};

export const NameLocked: Story = {
  args: { fullName: 'Paige Turner', nameLocked: true },
  render: args => <AdoptLauncher {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'When the sender locked the recipient name, the input is read-only and a hint explains why.',
      },
    },
  },
};

export const Initials: Story = {
  args: { variant: 'initials', fullName: 'PT' },
  render: args => <AdoptLauncher {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'The initials variant swaps the labels and shrinks the preview. InitialDialog wraps this configuration.',
      },
    },
  },
};
