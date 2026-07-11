import type { Meta, StoryObj } from '@storybook/react-vite';
import FileChooser from './FileChooser';

const meta = {
  title: 'Controls/File Chooser',
  component: FileChooser,
} satisfies Meta<typeof FileChooser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const MultipleFiles: Story = {
  args: { multiple: true },
};

export const ImagesOnly: Story = {
  args: { accept: 'image/png,image/jpeg' },
};
