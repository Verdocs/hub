import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import UploadDialog from './UploadDialog';
import Button from '../controls/Button';

const meta = {
  title: 'Dialogs/Upload Dialog',
  component: UploadDialog,
  parameters: {
    docs: {
      description: {
        component: 'Prompts the user to pick files to attach. Nothing is transmitted; the caller receives the files via onUpload and performs the actual upload.',
      },
    },
  },
} satisfies Meta<typeof UploadDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function UploadDialogLauncher({ multiple = false, maxSize }: { multiple?: boolean; maxSize?: number }) {
  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState('');

  return (
    <>
      <Button label="Upload Attachment" onClick={() => setOpen(true)} />
      {uploaded && (
        <p>
          {`Uploaded: ${uploaded}`}
        </p>
      )}
      {open && (
        <UploadDialog
          multiple={multiple}
          maxSize={maxSize}
          onUpload={(files) => {
            setUploaded(files.map(file => file.name).join(', '));
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}

export const Basic: Story = {
  render: () => <UploadDialogLauncher />,
};

export const MultipleFiles: Story = {
  render: () => <UploadDialogLauncher multiple />,
};

export const TinySizeLimit: Story = {
  render: () => <UploadDialogLauncher maxSize={1024} />,
};
